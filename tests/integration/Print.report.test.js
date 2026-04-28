// tests/integration/Print.report.test.js
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

let Print;

// HTML mínimo que simula o relatório de compra gerado pelo purchase.js
function gerarHtmlRelatorioTeste({ id = 1, fornecedor = 'Fornecedor Teste', total = 100 } = {}) {
    return `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; font-size: 11px; color: #333; }
            .container { padding: 20px; background: #fff; }
            .header-box { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
            .info-card { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
            .total-final { background: #28a745; color: white; font-size: 14px; font-weight: bold; padding: 15px; margin-top: 20px; border-radius: 4px; }
            .section-title { border-left: 4px solid #007bff; padding-left: 10px; margin: 20px 0 10px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header-box text-center">
                <h2>Relatório de Compra #${id}</h2>
                <p>Data: <strong>${new Date().toLocaleDateString('pt-BR')}</strong></p>
            </div>

            <div class="section-title">FORNECEDOR</div>
            <div class="info-card">
                <strong>${fornecedor}</strong><br>
                Razão Social: Razão Social Teste<br>
                CNPJ/CPF: 12.345.678/0001-99
            </div>

            <div class="section-title">ITENS DA COMPRA</div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#343a40; color:white;">
                        <th style="padding:6px;">Produto</th>
                        <th style="padding:6px; text-align:center;">Qtd</th>
                        <th style="padding:6px; text-align:right;">Unit.</th>
                        <th style="padding:6px; text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:6px; border:1px solid #dee2e6;">Produto A</td>
                        <td style="padding:6px; border:1px solid #dee2e6; text-align:center;">2,00</td>
                        <td style="padding:6px; border:1px solid #dee2e6; text-align:right;">R$ 50,00</td>
                        <td style="padding:6px; border:1px solid #dee2e6; text-align:right;">R$ 100,00</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-title">PAGAMENTO: Pix — R$ 100,00</div>
            <p style="color:#666; font-size:11px;">Pagamento à vista.</p>

            <div class="total-final" style="text-align:right;">
                TOTAL: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
        </div>
    </body>
    </html>
    `;
}

describe.sequential('Print.report integration', () => {
    beforeAll(async () => {
        vi.resetModules();

        // Mock do BrowserWindow, ipcMain e dialog do Electron
        // pois o ambiente de teste é Node puro, sem Electron
        vi.doMock('electron', () => ({
            BrowserWindow: class {
                constructor() {
                    this.webPreferences = {};
                }
                on() { }
                once(event, cb) { if (event === 'ready-to-show') cb(); }
                show() { }
                loadFile() { }
                static getFocusedWindow() { return null; }
            },
            ipcMain: {
                handleOnce() { },
                removeHandler() { },
            },
            dialog: {
                showSaveDialog: async () => ({ canceled: true }),
            },
        }));

        const printModule = await import('../../app/mixin/Print.js');
        Print = printModule.Print;
    });

    afterAll(async () => {
        vi.doUnmock('electron');
    });

    it('deve gerar um arquivo PDF no diretório temporário a partir do HTML do relatório', async () => {
        const html = gerarHtmlRelatorioTeste({ id: 42, fornecedor: 'Fornecedor Vitest', total: 100 });

        // Espia o Puppeteer para capturar o caminho do PDF gerado
        let pdfPathGerado = null;

        const puppeteerOriginal = await import('puppeteer');
        vi.doMock('puppeteer', () => ({
            default: {
                launch: async () => ({
                    newPage: async () => ({
                        setContent: async () => { },
                        pdf: async ({ path: p }) => {
                            pdfPathGerado = p;
                            // Gera o PDF real via Puppeteer original para validar o arquivo
                            const browser = await puppeteerOriginal.default.launch({
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
                            });
                            const page = await browser.newPage();
                            await page.setContent(html, { waitUntil: 'networkidle0' });
                            await page.pdf({
                                path: p,
                                format: 'A4',
                                printBackground: true,
                                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
                            });
                            await browser.close();
                        },
                    }),
                    close: async () => { },
                }),
            },
        }));

        // Reimporta Print com o mock do puppeteer ativo
        vi.resetModules();
        vi.doMock('electron', () => ({
            BrowserWindow: class {
                constructor() { }
                on() { }
                once(event, cb) { if (event === 'ready-to-show') cb(); }
                show() { }
                loadFile() { }
                static getFocusedWindow() { return null; }
            },
            ipcMain: { handleOnce() { }, removeHandler() { } },
            dialog: { showSaveDialog: async () => ({ canceled: true }) },
        }));

        const { Print: PrintFresh } = await import('../../app/mixin/Print.js');

        // Executa a geração do PDF
        await PrintFresh.create().stringHTML(html).print();

        // Valida que o PDF foi gerado no diretório temporário
        expect(pdfPathGerado).toBeTruthy();
        expect(pdfPathGerado).toMatch(/relatorio_\d+\.pdf$/);
        expect(path.dirname(pdfPathGerado)).toBe(os.tmpdir());

        // Valida que o arquivo existe e tem tamanho maior que 0
        const stat = fs.statSync(pdfPathGerado);
        expect(stat.isFile()).toBe(true);
        expect(stat.size).toBeGreaterThan(0);

        // Valida que o arquivo começa com o header de PDF (%PDF-)
        const buffer = Buffer.alloc(5);
        const fd = fs.openSync(pdfPathGerado, 'r');
        fs.readSync(fd, buffer, 0, 5, 0);
        fs.closeSync(fd);
        expect(buffer.toString('ascii')).toBe('%PDF-');

        // Limpeza
        try { fs.unlinkSync(pdfPathGerado); } catch { /* já removido */ }
    });

    it('deve gerar PDF com conteúdo do relatório de compra com parcelas', async () => {
        const htmlComParcelas = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head><meta charset="UTF-8"></head>
        <body>
            <h2>Relatório de Compra #99</h2>
            <p>Fornecedor: Empresa ABC</p>
            <table>
                <tr><td>Produto X</td><td>3x</td><td>R$ 33,33</td></tr>
                <tr><td>Produto X</td><td>3x</td><td>R$ 33,33</td></tr>
                <tr><td>Produto X</td><td>3x</td><td>R$ 33,34</td></tr>
            </table>
            <p>TOTAL: R$ 100,00</p>
        </body>
        </html>
        `;

        let pdfGerado = null;

        const puppeteerOriginal = await import('puppeteer');
        vi.resetModules();
        vi.doMock('puppeteer', () => ({
            default: {
                launch: async () => ({
                    newPage: async () => ({
                        setContent: async () => { },
                        pdf: async ({ path: p }) => {
                            pdfGerado = p;
                            const browser = await puppeteerOriginal.default.launch({
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
                            });
                            const page = await browser.newPage();
                            await page.setContent(htmlComParcelas, { waitUntil: 'networkidle0' });
                            await page.pdf({ path: p, format: 'A4', printBackground: true });
                            await browser.close();
                        },
                    }),
                    close: async () => { },
                }),
            },
        }));
        vi.doMock('electron', () => ({
            BrowserWindow: class {
                constructor() { }
                on() { }
                once(event, cb) { if (event === 'ready-to-show') cb(); }
                show() { }
                loadFile() { }
                static getFocusedWindow() { return null; }
            },
            ipcMain: { handleOnce() { }, removeHandler() { } },
            dialog: { showSaveDialog: async () => ({ canceled: true }) },
        }));

        const { Print: PrintFresh2 } = await import('../../app/mixin/Print.js');
        await PrintFresh2.create().stringHTML(htmlComParcelas).print();

        expect(pdfGerado).toBeTruthy();

        const stat = fs.statSync(pdfGerado);
        expect(stat.isFile()).toBe(true);
        expect(stat.size).toBeGreaterThan(0);

        // Valida header PDF
        const buffer = Buffer.alloc(5);
        const fd = fs.openSync(pdfGerado, 'r');
        fs.readSync(fd, buffer, 0, 5, 0);
        fs.closeSync(fd);
        expect(buffer.toString('ascii')).toBe('%PDF-');

        try { fs.unlinkSync(pdfGerado); } catch { /* já removido */ }
    });

    it('deve criar os arquivos temporários de preload e viewer durante a geração', async () => {
        const html = gerarHtmlRelatorioTeste({ id: 1, total: 50 });
        const arquivosTemporarios = [];

        const puppeteerOriginal = await import('puppeteer');
        vi.resetModules();
        vi.doMock('puppeteer', () => ({
            default: {
                launch: async () => ({
                    newPage: async () => ({
                        setContent: async () => { },
                        pdf: async ({ path: p }) => {
                            arquivosTemporarios.push(p);
                            const browser = await puppeteerOriginal.default.launch({
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
                            });
                            const page = await browser.newPage();
                            await page.setContent(html, { waitUntil: 'networkidle0' });
                            await page.pdf({ path: p, format: 'A4', printBackground: true });
                            await browser.close();
                        },
                    }),
                    close: async () => { },
                }),
            },
        }));

        // Espia o fs.writeFileSync para capturar os arquivos temporários criados
        const writeFileSpy = vi.spyOn(fs, 'writeFileSync');

        vi.doMock('electron', () => ({
            BrowserWindow: class {
                constructor() { }
                on() { }
                once(event, cb) { if (event === 'ready-to-show') cb(); }
                show() { }
                loadFile() { }
                static getFocusedWindow() { return null; }
            },
            ipcMain: { handleOnce() { }, removeHandler() { } },
            dialog: { showSaveDialog: async () => ({ canceled: true }) },
        }));

        const { Print: PrintFresh3 } = await import('../../app/mixin/Print.js');
        await PrintFresh3.create().stringHTML(html).print();

        // Verifica que writeFileSync foi chamado para o preload e o viewer
        const calls = writeFileSpy.mock.calls.map(c => c[0]);
        const preloadCall = calls.find(p => String(p).includes('print_preload_'));
        const viewerCall = calls.find(p => String(p).includes('print_viewer_'));

        expect(preloadCall).toBeTruthy();
        expect(viewerCall).toBeTruthy();

        // Valida que o conteúdo do viewer contém os elementos esperados do relatório
        const viewerContent = writeFileSpy.mock.calls.find(c => String(c[0]).includes('print_viewer_'))?.[1];
        expect(viewerContent).toContain('Visualizar PDF');
        expect(viewerContent).toContain('Salvar PDF');
        expect(viewerContent).toContain('application/pdf');

        writeFileSpy.mockRestore();

        // Limpeza dos PDFs gerados
        for (const p of arquivosTemporarios) {
            try { fs.unlinkSync(p); } catch { /* já removido */ }
        }
    });
});
// ES Module — todos os imports declarados no topo, require() não existe neste contexto
import { BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os'
import puppeteer from 'puppeteer'

export class Print {

    // Propriedade privada que armazena o HTML recebido via stringHTML()
    #html = null

    // Opções reservadas para impressão nativa caso seja necessário no futuro
    #opcoes = {
        marginsType: 0,
        pageSize: 'A4',
        printBackground: true,
        landscape: false
    }

    // Factory — ponto de entrada da interface fluente, retorna nova instância da classe
    static create() {
        return new Print();
    }

    // Define o conteúdo HTML a ser convertido em PDF e retorna this para encadeamento fluente
    stringHTML(html) {
        this.#html = html;
        return this;
    }

    // Gera o PDF, abre modal interno da aplicação com visualizador e opção de salvar
    async print() {

        // Gera ID único por timestamp para isolar arquivos e canais IPC em chamadas simultâneas
        const sessionId = Date.now();

        // Nome do arquivo PDF com timestamp para evitar colisão em requisições concorrentes
        const pdfFileName = `relatorio_${sessionId}.pdf`;

        // Caminho absoluto do PDF no diretório temporário nativo do sistema operacional
        const pdfPath = path.join(os.tmpdir(), pdfFileName);

        // Caminho do preload script temporário que será carregado pela janela do visualizador
        const preloadPath = path.join(os.tmpdir(), `print_preload_${sessionId}.js`);

        // Caminho do HTML temporário do visualizador que será exibido no BrowserWindow
        const viewerPath = path.join(os.tmpdir(), `print_viewer_${sessionId}.html`);

        // ── ETAPA 1: Gerar o PDF com Puppeteer ───────────────────────────────────────

        // Variável do browser declarada fora do try para garantir fechamento no finally
        let browser = null;

        try {

            // Inicia o Chromium em modo headless — sem interface gráfica, ideal para geração de documentos
            browser = await puppeteer.launch({

                // Modo headless moderno obrigatório a partir do Puppeteer v22, substitui o legado 'new'
                headless: true,

                // Flags do Chromium para compatibilidade máxima em Windows, macOS e Linux
                args: [

                    // Desativa o sandbox do Chrome — obrigatório em Linux sem privilégio de root
                    '--no-sandbox',

                    // Desativa sandbox de uid/gid — necessário em containers Docker e CI/CD
                    '--disable-setuid-sandbox',

                    // Desativa aceleração por GPU — servidores e VMs geralmente não possuem GPU
                    '--disable-gpu',

                    // Desativa extensões do Chromium para reduzir consumo de memória em produção
                    '--disable-extensions',

                    // Usa /tmp no lugar de /dev/shm para evitar falhas de memória em Linux restrito
                    '--disable-dev-shm-usage',

                ],
            });

            // Abre uma aba em branco no Chromium controlado para renderizar o HTML recebido
            const page = await browser.newPage();

            // Carrega o HTML da propriedade privada #html na aba recém criada do Chromium
            await page.setContent(this.#html, {

                // Aguarda a rede ficar ociosa — garante que CSS externo e fontes sejam carregados
                waitUntil: 'networkidle0',

            });

            // Converte o HTML renderizado em PDF e grava no arquivo temporário definido acima
            await page.pdf({

                // Destino do arquivo PDF no sistema de arquivos temporário do SO
                path: pdfPath,

                // Formato A4 — padrão internacional para documentos e relatórios corporativos
                format: 'A4',

                // Inclui cores e imagens de fundo do CSS no PDF gerado
                printBackground: true,

                // Margens de 10mm em todos os lados para layout equilibrado e profissional
                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },

            });

        } finally {

            // Encerra o processo do Chromium e libera memória RAM — executado mesmo em caso de erro
            if (browser) await browser.close();

        }

        // ── ETAPA 2: Criar o preload script temporário da janela visualizadora ─────────

        // Nome do canal IPC único por sessão — evita conflito entre múltiplas impressões abertas
        const saveChannel = `print:save:${sessionId}`;

        // Conteúdo do preload escrito como CommonJS pois Electron carrega preloads com require()
        const preloadContent = [
            // Ativa o modo estrito para evitar erros silenciosos no preload script
            `'use strict';`,
            // Importa contextBridge para expor API segura e ipcRenderer para comunicação com main
            `const { contextBridge, ipcRenderer } = require('electron');`,
            // Expõe printApi no window do renderer de forma segura via contextIsolation
            `contextBridge.exposeInMainWorld('printApi', {`,
            // Método salvar envia mensagem IPC para o main process disparar o diálogo de salvamento
            `    salvar: () => ipcRenderer.invoke('${saveChannel}'),`,
            `});`,
        ].join('\n');

        // Grava o preload no disco — obrigatório pois BrowserWindow só aceita caminho de arquivo
        fs.writeFileSync(preloadPath, preloadContent, 'utf-8');

        // ── ETAPA 3: Montar a URL do PDF compatível com file:// em todos os sistemas ─────

        // Converte backslashes do Windows em forward slashes exigidos pelo protocolo file://
        // Exemplo Windows: C:\Users\tmp\rel.pdf → file:///C:/Users/tmp/rel.pdf
        // Exemplo Linux/Mac: /tmp/rel.pdf → file:///tmp/rel.pdf
        const pdfFileUrl = 'file:///' + pdfPath.replace(/\\/g, '/');

        // ── ETAPA 4: Criar o HTML do visualizador com embed nativo do Chromium ──────────

        // Monta o HTML completo do visualizador com toolbar de ações e embed do PDF
        const viewerContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Visualizar PDF</title>
<style>
  *, *::before, *::after {
    margin: 0; padding: 0; box-sizing: border-box;
  }
  body {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #2b2b2b;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  }
  /* Barra superior arrastável como uma titlebar nativa */
  #toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    height: 50px;
    background: #1a1a2e;
    border-bottom: 1px solid #0f3460;
    color: #e0e0e0;
    flex-shrink: 0;
    /* Permite arrastar a janela pela toolbar como se fosse a barra de título */
    -webkit-app-region: drag;
  }
  /* Botões e textos dentro da toolbar não devem participar do drag */
  #toolbar * {
    -webkit-app-region: no-drag;
  }
  #toolbar-title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 18px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: filter .15s, opacity .15s;
    white-space: nowrap;
  }
  .btn:hover  { filter: brightness(1.15); }
  .btn:active { filter: brightness(.9); }
  .btn:disabled { opacity: .45; cursor: not-allowed; filter: none; }
  .btn-save  { background: #16a34a; color: #fff; }
  .btn-close { background: #dc2626; color: #fff; }
  /* O embed ocupa todo o espaço restante abaixo da toolbar */
  #pdf-viewer {
    flex: 1;
    width: 100%;
    display: block;
    border: none;
  }
</style>
</head>
<body>

  <div id="toolbar">
    <span id="toolbar-title">📄 Visualizador de PDF — ${pdfFileName}</span>
    <button class="btn btn-save"  id="btn-save"  onclick="salvarPdf()">⬇ Salvar PDF</button>
    <button class="btn btn-close" id="btn-close" onclick="window.close()">✕ Fechar</button>
  </div>

  <!--
    O elemento embed aciona o visualizador nativo de PDF do Chromium embutido no Electron.
    type="application/pdf" instrui o Chromium a usar o plugin PDF em vez de baixar o arquivo.
    Ambos os arquivos estão em file:// (mesma origem) — sem bloqueio de segurança.
  -->
  <embed id="pdf-viewer" src="${pdfFileUrl}" type="application/pdf">

  <script>
    // Aciona o fluxo de salvamento via IPC e gerencia o estado visual do botão durante a operação
    async function salvarPdf() {
      const btn = document.getElementById('btn-save');
      // Desabilita o botão para evitar duplo clique durante o diálogo de salvamento
      btn.disabled = true;
      btn.textContent = '⏳ Aguarde...';
      try {
        // Chama o método salvar exposto pelo contextBridge no preload desta janela
        const result = await window.printApi.salvar();
        // Exibe feedback visual de sucesso por 2 segundos antes de restaurar o botão
        if (result && result.status) {
          btn.style.background = '#0369a1';
          btn.textContent = '✔ PDF Salvo!';
          setTimeout(() => {
            btn.style.background = '';
            btn.textContent = '⬇ Salvar PDF';
            btn.disabled = false;
          }, 2000);
        } else {
          // Usuário cancelou o diálogo de salvamento — apenas restaura o botão
          btn.disabled = false;
          btn.textContent = '⬇ Salvar PDF';
        }
      } catch (err) {
        // Em caso de erro inesperado no IPC, restaura o botão e loga no console
        console.error('Erro ao salvar PDF:', err);
        btn.disabled = false;
        btn.textContent = '⬇ Salvar PDF';
      }
    }
  </script>

</body>
</html>`;

        // Grava o HTML do visualizador no disco para ser carregado via loadFile()
        fs.writeFileSync(viewerPath, viewerContent, 'utf-8');

        // ── ETAPA 5: Abrir a janela modal do visualizador ─────────────────────────────

        // Obtém a janela atualmente em foco para usá-la como pai do modal
        const parentWin = BrowserWindow.getFocusedWindow();

        // Cria o BrowserWindow do visualizador com preload isolado e contextIsolation ativo
        const viewerWin = new BrowserWindow({

            // Largura inicial da janela do visualizador em pixels
            width: 920,

            // Altura inicial da janela do visualizador em pixels
            height: 720,

            // Largura mínima para garantir que a toolbar não quebre o layout
            minWidth: 640,

            // Altura mínima para garantir que o PDF seja sempre visível
            minHeight: 480,

            // Título da janela exibido na barra de tarefas do sistema operacional
            title: 'Visualizar PDF',

            // Define a janela pai — quando não há janela focada, abre como janela independente
            parent: parentWin || undefined,

            // Ativa comportamento modal bloqueando interação com a janela pai enquanto aberta
            modal: !!parentWin,

            // Inicia oculta e exibe apenas no evento ready-to-show para evitar flash de tela branca
            show: false,

            // Remove a barra de menus padrão do Electron (File, Edit, View, etc.)
            autoHideMenuBar: true,

            webPreferences: {

                // Caminho do preload temporário gerado acima que expõe printApi via contextBridge
                preload: preloadPath,

                // Isola os contextos JS do renderer e do preload — requisito de segurança do Electron
                contextIsolation: true,

                // Proíbe acesso direto às APIs Node.js no renderer — segurança obrigatória em produção
                nodeIntegration: false,

            },
        });

        // ── ETAPA 6: Registrar o handler IPC de salvamento para esta sessão ─────────────

        // handleOnce registra o handler e o remove automaticamente após a primeira invocação
        ipcMain.handleOnce(saveChannel, async () => {

            // Abre o diálogo nativo de "Salvar como" do sistema operacional
            const result = await dialog.showSaveDialog(viewerWin, {

                // Título exibido na barra do diálogo nativo de salvamento
                title: 'Salvar PDF',

                // Nome de arquivo sugerido pré-preenchido no campo de nome do diálogo
                defaultPath: pdfFileName,

                // Filtro que restringe a seleção apenas a arquivos PDF no diálogo nativo
                filters: [{ name: 'Arquivo PDF', extensions: ['pdf'] }],

            });

            // Se o usuário cancelou o diálogo, retorna status false sem realizar operação
            if (result.canceled || !result.filePath) {
                return { status: false };
            }

            // Copia o PDF do diretório temporário para o caminho escolhido pelo usuário
            fs.copyFileSync(pdfPath, result.filePath);

            // Retorna status true para o renderer exibir o feedback visual de sucesso
            return { status: true };

        });

        // ── ETAPA 7: Limpeza de todos os arquivos temporários ao fechar a janela ────────

        viewerWin.on('closed', () => {

            // Remove o handler IPC caso a janela feche antes de o usuário clicar em Salvar
            // A chamada é segura — se handleOnce já consumiu o handler, removeHandler é no-op
            try { ipcMain.removeHandler(saveChannel); } catch { /* já removido pelo handleOnce */ }

            // Deleta os três arquivos temporários criados por esta sessão de impressão
            for (const tmpFile of [pdfPath, preloadPath, viewerPath]) {
                // Usa try/catch individual para garantir que todos os arquivos sejam tentados
                try { fs.unlinkSync(tmpFile); } catch { /* arquivo já removido ou sem permissão */ }
            }

        });

        // Exibe a janela somente após o conteúdo estar completamente renderizado
        viewerWin.once('ready-to-show', () => viewerWin.show());

        // Carrega o HTML do visualizador a partir do arquivo temporário criado na Etapa 4
        viewerWin.loadFile(viewerPath);

    }
}
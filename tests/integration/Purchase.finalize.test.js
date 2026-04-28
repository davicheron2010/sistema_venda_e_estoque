// tests/integration/Purchase.finalize.test.js
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';
import knex from 'knex';

dotenv.config({ path: '.env' });

let db;
let Purchase;

const createdPurchaseIds = new Set();

describe.sequential('Purchase.finalize integration', () => {
    beforeAll(async () => {
        db = knex({
            client: 'pg',
            connection: {
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT) || 5432,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                ssl: false,
            },
            searchPath: [process.env.DB_SCHEMA || 'public'],
            pool: {
                min: 0,
                max: 1,
                acquireTimeoutMillis: 15000,
                idleTimeoutMillis: 1000,
            },
            debug: false,
        });

        await db.raw('select 1');

        vi.resetModules();
        vi.doMock('../../app/database/Connection.js', () => ({
            default: db,
        }));

        const purchaseModule = await import('../../app/controller/Purchase.js');
        Purchase = purchaseModule.default;
    });

    afterAll(async () => {
        try {
            if (createdPurchaseIds.size > 0) {
                await db('installment_sale_purchase')
                    .whereIn('id_purchase', [...createdPurchaseIds])
                    .del();

                await db('item_purchase')
                    .whereIn('id_compra', [...createdPurchaseIds])
                    .del();

                await db('purchase')
                    .whereIn('id', [...createdPurchaseIds])
                    .del();
            }
        } finally {
            if (db) await db.destroy();
            vi.doUnmock('../../app/database/Connection.js');
        }
    });

    // ── helpers ──────────────────────────────────────────────────────────────

    async function criarCompra() {
        const [purchase] = await db('purchase')
            .insert({
                id_fornecedor: null,
                total_bruto: 100,
                total_liquido: 100,
                desconto: 0,
                acrescimo: 0,
                observacao: 'Teste automatizado',
                estado_compra: 'EM_ANDAMENTO',
            })
            .returning('*');

        createdPurchaseIds.add(purchase.id);
        return purchase;
    }

    async function buscarPaymentTerm(titulo) {
        return db('payment_terms')
            .whereRaw('LOWER(titulo) LIKE ?', [`%${titulo.toLowerCase()}%`])
            .first();
    }

    async function buscarInstallments(id_pagamento) {
        return db('installment')
            .where({ id_pagamento })
            .orderBy('parcela', 'asc');
    }

    // ── testes ────────────────────────────────────────────────────────────────

    it('deve mudar estado_compra para RECEBIDO ao finalizar com pix (à vista)', async () => {
        const purchase = await criarCompra();
        const pix = await buscarPaymentTerm('pix');

        expect(pix).toBeTruthy();

        const formas = [
            {
                id_payment_terms: pix.id,
                parcelas: 1,
                valor: 100,
                installments: [],
            },
        ];

        const result = await Purchase.finalize({
            id_purchase: purchase.id,
            formas,
        });

        expect(result.status).toBe(true);
        expect(result.msg).toBe('Compra finalizada com sucesso!');

        const persisted = await db('purchase')
            .where({ id: purchase.id })
            .first();

        expect(persisted.estado_compra).toBe('RECEBIDO');
    });

    it('deve mudar estado_compra para RECEBIDO ao finalizar com boleto parcelado', async () => {
        const purchase = await criarCompra();
        const boleto = await buscarPaymentTerm('boleto');

        expect(boleto).toBeTruthy();

        const installments = await buscarInstallments(boleto.id);
        expect(installments.length).toBeGreaterThan(0);

        // Usa apenas as 3 primeiras parcelas
        const parcelasUsadas = installments.slice(0, 3);

        const formas = [
            {
                id_payment_terms: boleto.id,
                parcelas: 3,
                valor: 100,
                installments: parcelasUsadas,
            },
        ];

        const result = await Purchase.finalize({
            id_purchase: purchase.id,
            formas,
        });

        expect(result.status).toBe(true);

        const persisted = await db('purchase')
            .where({ id: purchase.id })
            .first();

        expect(persisted.estado_compra).toBe('RECEBIDO');
    });

    it('deve mudar estado_compra para RECEBIDO com 2 formas de pagamento', async () => {
        const purchase = await criarCompra();
        const [pix, cartao] = await Promise.all([
            buscarPaymentTerm('pix'),
            buscarPaymentTerm('cartão'),
        ]);

        expect(pix).toBeTruthy();
        expect(cartao).toBeTruthy();

        const installments = await buscarInstallments(cartao.id);
        const parcelasUsadas = installments.slice(0, 2);

        const formas = [
            {
                id_payment_terms: pix.id,
                parcelas: 1,
                valor: 50,
                installments: [],
            },
            {
                id_payment_terms: cartao.id,
                parcelas: 2,
                valor: 50,
                installments: parcelasUsadas,
            },
        ];

        const result = await Purchase.finalize({
            id_purchase: purchase.id,
            formas,
        });

        expect(result.status).toBe(true);

        const persisted = await db('purchase')
            .where({ id: purchase.id })
            .first();

        expect(persisted.estado_compra).toBe('RECEBIDO');
    });

    it('deve salvar o número correto de parcelas em installment_sale_purchase', async () => {
        const purchase = await criarCompra();
        const boleto = await buscarPaymentTerm('boleto');
        const installments = await buscarInstallments(boleto.id);
        const parcelasUsadas = installments.slice(0, 4);

        const formas = [
            {
                id_payment_terms: boleto.id,
                parcelas: 4,
                valor: 100,
                installments: parcelasUsadas,
            },
        ];

        await Purchase.finalize({ id_purchase: purchase.id, formas });

        const registros = await db('installment_sale_purchase')
            .where({ id_purchase: purchase.id });

        expect(registros).toHaveLength(4);

        // Verifica que os valores das parcelas somam o total
        const somaValores = registros.reduce((acc, r) => acc + parseFloat(r.valor_parcela), 0);
        expect(parseFloat(somaValores.toFixed(2))).toBe(100);

        // Verifica que todas têm status 'aberto'
        registros.forEach(r => {
            expect(r.status).toBe('aberto');
            expect(r.id_purchase).toBe(purchase.id);
            expect(r.id_sale).toBeNull();
        });
    });

    it('deve sobrescrever parcelas antigas ao finalizar a mesma compra duas vezes', async () => {
        const purchase = await criarCompra();
        const pix = await buscarPaymentTerm('pix');

        const formas = [{ id_payment_terms: pix.id, parcelas: 1, valor: 100, installments: [] }];

        // Finaliza 2 vezes
        await Purchase.finalize({ id_purchase: purchase.id, formas });
        await Purchase.finalize({ id_purchase: purchase.id, formas });

        const registros = await db('installment_sale_purchase')
            .where({ id_purchase: purchase.id });

        // Deve ter apenas 1 registro (a segunda chamada deletou e reinseriu)
        expect(registros).toHaveLength(1);
    });

    it('deve retornar erro quando id_purchase não for informado', async () => {
        const result = await Purchase.finalize({ id_purchase: null, formas: [] });

        expect(result.status).toBe(false);
        expect(result.msg).toContain('obrigatório');
    });

    it('deve retornar erro quando formas estiver vazio', async () => {
        const purchase = await criarCompra();

        const result = await Purchase.finalize({
            id_purchase: purchase.id,
            formas: [],
        });

        expect(result.status).toBe(false);
        expect(result.msg).toContain('pagamento');
    });
});
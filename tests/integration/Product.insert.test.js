import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';
import knex from 'knex';

dotenv.config({ path: '.env' });

const createdIds = new Set();

let db;
let Product;

describe.sequential('Product.insert integration', () => {
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

        const productModule = await import('../../app/controller/Product.js');
        Product = productModule.default;
    });

    afterAll(async () => {
        try {
            if (createdIds.size > 0) {
                await db('product')
                    .whereIn('id', [...createdIds])
                    .del();
            }
        } finally {
            if (db) await db.destroy();
            vi.doUnmock('../../app/database/Connection.js');
        }
    });

    it('deve inserir um produto real no banco quando os dados forem válidos', async () => {
        const payload = {
            nome: `Produto Teste ${Date.now()}`,
            unidade: 'UN',
            preco_compra: 10.50,
            preco_venda: 19.90,
        };

        const result = await Product.insert(payload);

        expect(result.status).toBe(true);
        expect(result.msg).toBe('Produto cadastrado com sucesso!');
        expect(result.id).toBeTruthy();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(1);

        createdIds.add(result.id);

        const persisted = await db('product')
            .where({ id: result.id })
            .first();

        expect(persisted).toBeTruthy();
        expect(Number(persisted.id)).toBe(Number(result.id));
        expect(persisted.nome).toBe(payload.nome);
        expect(persisted.unidade).toBe(payload.unidade);
        expect(parseFloat(persisted.preco_compra)).toBe(payload.preco_compra);
        expect(parseFloat(persisted.preco_venda)).toBe(payload.preco_venda);
        expect(persisted.ativo).toBe(true);
        expect(persisted.excluido).toBe(false);
        expect(persisted.created_at).toBeTruthy();
        expect(persisted.updated_at).toBeTruthy();
    });

    it('não deve inserir no banco quando o nome for inválido', async () => {
        const payload = {
            nome: ' ',
            unidade: 'UN',
            preco_compra: 5.00,
        };

        const result = await Product.insert(payload);

        expect(result).toStrictEqual({
            status: false,
            msg: 'O campo nome é obrigatório',
            id: null,
            data: [],
        });

        // Garante que nada foi inserido com esse preco_compra neste momento
        const persisted = await db('product')
            .where({ preco_compra: payload.preco_compra, unidade: payload.unidade })
            .whereRaw("nome IS NULL OR TRIM(nome) = ''")
            .first();

        expect(persisted).toBeUndefined();
    });
});
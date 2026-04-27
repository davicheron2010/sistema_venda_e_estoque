// tests/integration/Customer.insert.test.js
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';
import knex from 'knex';

dotenv.config({ path: '.env' });

const createdIds = new Set();

let db;
let Customer;

function uniqueDigits(length) {
    const raw = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
    return raw.replace(/\D/g, '').slice(0, length).padEnd(length, '0');
}

describe.sequential('Customer.insert integration', () => {
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

        const customerModule = await import('../../app/controller/Customer.js');
        Customer = customerModule.default;
    });

    afterAll(async () => {
        try {
            if (createdIds.size > 0) {
                /*await db('customer')
                    .whereIn('id', [...createdIds])
                    .del();*/
            }
        } finally {
            if (db) {
                await db.destroy();
            }
            vi.doUnmock('../../app/database/Connection.js');
        }
    });

    it('deve inserir um cliente real no banco quando os dados forem válidos', async () => {
        const payload = {
            nome: `Maria Souza ${Date.now()}`,
            cpf: uniqueDigits(11),
            rg: uniqueDigits(9),
        };

        const result = await Customer.insert(payload);

        expect(result.status).toBe(true);
        expect(result.msg).toBe('Salvo com sucesso!');
        expect(result.id).toBeTruthy();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(1);

        createdIds.add(result.id);

        const persisted = await db('customer')
            .where({ id: result.id })
            .first();

        expect(persisted).toBeTruthy();
        expect(Number(persisted.id)).toBe(Number(result.id));
        expect(persisted.nome).toBe(payload.nome);
        expect(persisted.cpf).toBe(payload.cpf);
        expect(persisted.rg).toBe(payload.rg);
        expect(persisted.ativo).toBe(true);
        expect(persisted.excluido).toBe(false);
        expect(persisted.criado_em).toBeTruthy();
        expect(persisted.atualizado_em).toBeTruthy();
    });

    it('não deve inserir no banco quando o nome for inválido', async () => {
        const payload = {
            nome: ' ',
            cpf: uniqueDigits(11),
            rg: uniqueDigits(9),
        };

        const result = await Customer.insert(payload);

        expect(result).toStrictEqual({
            status: false,
            msg: 'O campo nome é obrigatório',
            id: null,
            data: [],
        });

        const persisted = await db('customer')
            .where({ cpf: payload.cpf })
            .first();

        expect(persisted).toBeUndefined();
    });
});
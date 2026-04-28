// tests/integration/Company.insert.test.js
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';
import knex from 'knex';
dotenv.config({ path: '.env' });
const createdIds = new Set();
let db;
let Company;
function uniqueDigits(length) {
    const raw = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
    return raw.replace(/\D/g, '').slice(0, length).padEnd(length, '0');
}
describe.sequential('Company.insert integration', () => {
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
        const companyModule = await import('../../app/controller/Company.js');
        Company = companyModule.default;
    });
    afterAll(async () => {
        try {
            if (createdIds.size > 0) {
            }
        } finally {
            if (db) {
                await db.destroy();
            }
            vi.doUnmock('../../app/database/Connection.js');
        }
    });
    it('deve inserir uma empresa real no banco quando os dados forem válidos', async () => {
        const payload = {
            nome: `Empresa Teste ${Date.now()}`,
            cnpj: uniqueDigits(14),
            email: `contato${Date.now()}@empresa.com`,
            telefone: uniqueDigits(11),
        };
        const result = await Company.insert(payload);
        expect(result.status).toBe(true);
        expect(result.msg).toBe('Empresa salva com sucesso!');
        expect(result.id).toBeTruthy();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(1);
        createdIds.add(result.id);
        const persisted = await db('company')
            .where({ id: result.id })
            .first();
        expect(persisted).toBeTruthy();
        expect(Number(persisted.id)).toBe(Number(result.id));
        expect(persisted.nome).toBe(payload.nome);
        expect(persisted.cnpj).toBe(payload.cnpj);
        expect(persisted.email).toBe(payload.email);
        expect(persisted.telefone).toBe(payload.telefone);
        expect(persisted.ativo).toBe(true);
        expect(persisted.excluido).toBe(false);
        expect(persisted.criado_em).toBeTruthy();
        expect(persisted.atualizado_em).toBeTruthy();
    });
    it('deve inserir uma empresa sem campos opcionais (apenas nome)', async () => {
        const payload = {
            nome: `Empresa Mínima ${Date.now()}`,
        };
        const result = await Company.insert(payload);
        expect(result.status).toBe(true);
        expect(result.msg).toBe('Empresa salva com sucesso!');
        expect(result.id).toBeTruthy();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(1);
        createdIds.add(result.id);
        const persisted = await db('company')
            .where({ id: result.id })
            .first();
        expect(persisted).toBeTruthy();
        expect(persisted.nome).toBe(payload.nome);
        expect(persisted.ativo).toBe(true);
        expect(persisted.excluido).toBe(false);
    });
    it('não deve inserir no banco quando o nome for inválido', async () => {
        const payload = {
            nome: ' ',
            cnpj: uniqueDigits(14),
            email: `contato${Date.now()}@empresa.com`,
            telefone: uniqueDigits(11),
        };
        const result = await Company.insert(payload);
        expect(result).toStrictEqual({
            status: false,
            msg: 'O campo nome é obrigatório',
            id: null,
            data: [],
        });
        const persisted = await db('company')
            .where({ cnpj: payload.cnpj })
            .first();
        expect(persisted).toBeUndefined();
    });
});

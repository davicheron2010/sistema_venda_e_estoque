// tests/unit/Company.insert.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Company from '../../app/controller/Company.js';
import connection from '../../app/database/Connection.js';

vi.mock('../../app/database/Connection.js', () => ({
    default: vi.fn(),
}));

describe('Company.insert', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Define o teste provando que nome vazio impede o acesso ao banco
    it('deve retornar erro quando o nome estiver vazio e não acessar o banco', async () => {
        // Monta o payload com nome contendo apenas espaços, simulando campo vazio
        const payload = {
            nome: '   ',            // nome inválido — só espaços em branco
            cnpj: '12345678000195', // cnpj válido para isolar a falha apenas no nome
            action: 'create',       // ação de criação sendo solicitada
        };

        // Executa o método real passando o payload com nome inválido
        const result = await Company.insert(payload);

        // Verifica se o retorno é exatamente o objeto de erro esperado
        expect(result).toStrictEqual({
            status: false,                       // indica que a operação falhou
            msg: 'O campo nome é obrigatório',   // mensagem de erro retornada
            id: null,                            // nenhum id gerado pois não houve insert
            data: [],                            // nenhum dado retornado
        });

        // Garante que o banco jamais foi acessado quando a validação falhou
        expect(connection).not.toHaveBeenCalled();
    });

    // Define o teste e descreve o que ele espera provar
    it('deve inserir com sucesso quando os dados forem válidos', async () => {
        // Simula o registro que seria retornado pelo banco após o insert
        const insertedRow = {
            id: 1,
            nome: 'Empresa Teste LTDA',
            cnpj: '12345678000195',
            email: 'contato@empresa.com',
            telefone: '11999999999',
            ativo: true,
            excluido: false,
        };

        // Simula o método .returning() do Knex, retornando o registro inserido dentro de um array
        const returningMock = vi.fn().mockResolvedValue([insertedRow]);

        // Simula o método .insert() do Knex, que ao ser chamado retorna o .returning() falso
        const insertMock = vi.fn().mockReturnValue({
            returning: returningMock,
        });

        // Faz a conexão falsa retornar um objeto com o .insert() simulado quando chamada com a tabela
        connection.mockReturnValue({
            insert: insertMock,
        });

        // Define os dados que serão enviados para o Company.insert, simulando um formulário preenchido
        const payload = {
            nome: 'Empresa Teste LTDA',
            cnpj: '12345678000195',
            email: 'contato@empresa.com',
            telefone: '11999999999',
            action: 'c', // ação de criação
            id: '',
        };

        // Executa o método real sendo testado passando o payload
        const result = await Company.insert(payload);

        // Verifica se a conexão foi chamada apontando para a tabela 'company'
        expect(connection).toHaveBeenCalledWith('company');

        // Verifica se o insert foi chamado com os dados corretos, sem os campos action e id
        expect(insertMock).toHaveBeenCalledWith({
            nome: 'Empresa Teste LTDA',
            cnpj: '12345678000195',
            email: 'contato@empresa.com',
            telefone: '11999999999',
        });

        // Verifica se o .returning() foi chamado pedindo todos os campos da linha inserida
        expect(returningMock).toHaveBeenCalledWith('*');

        // Verifica se o retorno final da função é exatamente o esperado
        expect(result).toStrictEqual({
            status: true,
            msg: 'Empresa salva com sucesso!',
            id: 1,
            data: [insertedRow],
        });
    });

    // Testa o insert com apenas o campo obrigatório (nome), sem campos opcionais
    it('deve inserir com sucesso quando apenas o nome for informado', async () => {
        // Simula o registro mínimo retornado pelo banco
        const insertedRow = {
            id: 2,
            nome: 'Empresa Simples',
            cnpj: null,
            email: null,
            telefone: null,
            ativo: true,
            excluido: false,
        };

        const returningMock = vi.fn().mockResolvedValue([insertedRow]);
        const insertMock = vi.fn().mockReturnValue({
            returning: returningMock,
        });

        connection.mockReturnValue({
            insert: insertMock,
        });

        const payload = {
            nome: 'Empresa Simples',
            action: 'c',
            id: '',
        };

        const result = await Company.insert(payload);

        // Verifica que o insert foi chamado somente com os campos presentes
        expect(insertMock).toHaveBeenCalledWith({
            nome: 'Empresa Simples',
        });

        expect(result).toStrictEqual({
            status: true,
            msg: 'Empresa salva com sucesso!',
            id: 2,
            data: [insertedRow],
        });
    });
});
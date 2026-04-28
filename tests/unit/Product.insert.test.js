import { describe, it, expect, vi, beforeEach } from 'vitest';
import Product from '../../app/controller/Product.js';
import connection from '../../app/database/Connection.js';

vi.mock('../../app/database/Connection.js', () => ({
    default: vi.fn(),
}));

describe('Product.insert', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve retornar erro quando o nome estiver vazio e não acessar o banco', async () => {
        const payload = {
            nome: '   ',        // nome inválido — só espaços em branco
            unidade: 'UN',      // campo válido para isolar a falha apenas no nome
            action: 'create',
        };

        const result = await Product.insert(payload);

        expect(result).toStrictEqual({
            status: false,
            msg: 'O campo nome é obrigatório',
            id: null,
            data: [],
        });

        expect(connection).not.toHaveBeenCalled();
    });

    it('deve inserir com sucesso quando os dados forem válidos', async () => {
        const insertedRow = {
            id: 1,
            nome: 'Arroz Integral 1kg',
            unidade: 'UN',
            preco_compra: 10.00,
            preco_venda: 15.00,
            ativo: true,
            excluido: false,
        };

        const returningMock = vi.fn().mockResolvedValue([insertedRow]);
        const insertMock = vi.fn().mockReturnValue({ returning: returningMock });

        connection.mockReturnValue({ insert: insertMock });

        const payload = {
            nome: 'Arroz Integral 1kg',
            unidade: 'UN',
            preco_compra: 10.00,
            preco_venda: 15.00,
            action: 'create',
            id: '',
        };

        const result = await Product.insert(payload);

        expect(connection).toHaveBeenCalledWith('product');
        expect(insertMock).toHaveBeenCalledWith({
            nome: 'Arroz Integral 1kg',
            unidade: 'UN',
            preco_compra: 10.00,
            preco_venda: 15.00,
        });
        expect(returningMock).toHaveBeenCalledWith('*');
        expect(result).toStrictEqual({
            status: true,
            msg: 'Produto cadastrado com sucesso!',
            id: 1,
            data: [insertedRow],
        });
    });
});
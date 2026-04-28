import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sale from '../../app/controller/Sale.js';
import connection from '../../app/database/Connection.js';

vi.mock('../../app/database/Connection.js', () => ({
  default: vi.fn()
}));

describe('Sale.insertItem (unit)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inserir item e atualizar totais da venda', async () => {

    // mock produto
    const productMock = {
      id: 1,
      nome: 'Produto Teste',
      preco_venda: 10
    };

    // mock chain do knex
    const whereMock = vi.fn()
      .mockReturnValueOnce({ first: vi.fn().mockResolvedValue(productMock) }) // busca produto
      .mockReturnValueOnce({ sum: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue({ total_bruto: 20, total_liquido: 20 }) }) }) // soma
      .mockReturnValueOnce({ update: vi.fn().mockResolvedValue(true) }); // update venda

    const insertMock = vi.fn().mockResolvedValue(true);

    connection.mockImplementation((table) => {
      if (table === 'product') {
        return { where: whereMock };
      }
      if (table === 'item_sale') {
        return {
          insert: insertMock,
          where: whereMock
        };
      }
      if (table === 'sale') {
        return {
          where: whereMock
        };
      }
    });

    const payload = {
      id: 1, // id_venda
      id_produto: 1,
      quantidade: 2,
      preco_unitario: 10
    };

    const result = await Sale.insertItem(payload);

    expect(result.status).toBe(true);
    expect(result.msg).toBe('Item inserido com sucesso!');
    expect(insertMock).toHaveBeenCalled();
  });

  it('deve falhar se produto não existir', async () => {

    const whereMock = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null)
    });

    connection.mockReturnValue({
      where: whereMock
    });

    const result = await Sale.insertItem({
      id: 1,
      id_produto: 999
    });

    expect(result.status).toBe(false);
    expect(result.msg).toBe('Restrição: Nenhum produto localizado!');
  });

});
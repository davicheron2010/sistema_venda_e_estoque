import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sale from '../../app/controller/Sale.js';
import connection from '../../app/database/Connection.js';

vi.mock('../../app/database/Connection.js', () => ({
  default: vi.fn()
}));

describe('Sale.insert', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inserir uma venda com sucesso', async () => {
    const returningMock = vi.fn().mockResolvedValue([{ id: 10 }]);

    const insertMock = vi.fn().mockReturnValue({
      returning: returningMock
    });

    connection.mockReturnValue({
      insert: insertMock
    });

    const payload = {
      id_cliente: 1,
      total_bruto: 100,
      total_liquido: 100
    };

    const result = await Sale.insert(payload);

    expect(connection).toHaveBeenCalledWith('sale');
    expect(insertMock).toHaveBeenCalledWith(payload);
    expect(returningMock).toHaveBeenCalledWith('id');

    expect(result).toStrictEqual({
      status: true,
      id: 10
    });
  });

  it('deve retornar erro quando ocorrer falha no banco', async () => {
    const insertMock = vi.fn().mockImplementation(() => {
      throw new Error('Erro no banco');
    });

    connection.mockReturnValue({
      insert: insertMock
    });

    const result = await Sale.insert({});

    expect(result).toStrictEqual({
      status: false,
      error: 'Erro no banco'
    });
  });

});
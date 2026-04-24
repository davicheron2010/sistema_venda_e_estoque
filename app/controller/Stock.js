'use strict';

import Connection from '../database/Connection.js';

class Stock {

    /**
     * Ajuste de estoque (entrada, saída ou ajuste direto)
     */
    async adjust(data) {
        try {
            let quantidadeEntrada = 0;
            let quantidadeSaida = 0;
            let tipo = data.tipo;

            // 🔥 CASO 1: ajuste direto (zera ou define estoque final)
            if (data.tipo === 'AJUSTE') {

                const atual = await Connection('mvw_estoque')
                    .where('id_produto', data.id_produto)
                    .first();

                const estoqueAtual = Number(atual?.estoque_atual || 0);
                const novoEstoque = Number(data.quantidade);

                const diferenca = novoEstoque - estoqueAtual;

                if (diferenca > 0) {
                    tipo = 'ENTRADA';
                    quantidadeEntrada = diferenca;
                } else if (diferenca < 0) {
                    tipo = 'SAIDA';
                    quantidadeSaida = Math.abs(diferenca);
                } else {
                    return {
                        status: true,
                        msg: 'Nenhuma alteração no estoque.'
                    };
                }

            } else {
                // 🔥 CASO 2: entrada ou saída manual normal
                quantidadeEntrada = data.tipo === 'ENTRADA' ? data.quantidade : 0;
                quantidadeSaida = data.tipo === 'SAIDA' ? data.quantidade : 0;
            }

            // 🔥 INSERE MOVIMENTAÇÃO
            const [result] = await Connection('stock_movement')
                .insert({
                    id_produto: data.id_produto,
                    quantidade_entrada: quantidadeEntrada,
                    quantidade_saida: quantidadeSaida,
                    tipo,
                    origem_movimento: 'AJUSTE_MANUAL',
                    observacao: data.observacao || '',
                    data_cadastro: new Date()
                })
                .returning('id');

            return {
                status: true,
                msg: 'Movimentação de estoque registrada!',
                id: result.id
            };

        } catch (error) {
            console.error('Erro no Stock.adjust:', error);

            return {
                status: false,
                msg: 'Erro ao salvar no estoque: ' + error.message
            };
        }
    }

    /**
     * Histórico de movimentações
     */
    async getMovements(id_produto) {
        try {
            return await Connection('stock_movement')
                .where('id_produto', id_produto)
                .orderBy('data_cadastro', 'desc');
        } catch (error) {
            console.error(error);
            return [];
        }
    }
}

export default new Stock();
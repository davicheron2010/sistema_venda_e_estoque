import connection from '../database/Connection.js';

export default class Purchase {
    static table = 'purchase';
    static #columns = ['id', 'id_fornecedor', 'total_bruto', 'total_liquido', 'desconto', 'acrescimo', 'observacao', 'data_cadastro', 'data_atualizacao', null];
    static #searchable = ['id_fornecedor', 'total_bruto', 'total_liquido', 'desconto', 'acrescimo', 'observacao'];

    static async find(data = {}) {
        const { term = '', limit = 10, offset = 0, orderType = 'asc', column = 0, draw = 1 } = data;

        const [{ count: total }] = await connection(Purchase.table).count('id as count');

        const search = term?.trim();
        function applySearch(query) {
            if (search) {
                query.where(function () {
                    for (const col of Purchase.#searchable) {
                        this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${search}%`]);
                    }
                });
            }
            return query;
        }

        const filteredQ = connection(Purchase.table).count('id as count');
        applySearch(filteredQ);
        const [{ count: filtered }] = await filteredQ;

        const orderColumn = Purchase.#columns[column] || 'id';
        const orderDir = orderType === 'desc' ? 'desc' : 'asc';

        const dataQ = connection(Purchase.table).select('*');
        applySearch(dataQ);
        dataQ.orderBy(orderColumn, orderDir);
        dataQ.limit(parseInt(limit));
        dataQ.offset(parseInt(offset));

        const rows = await dataQ;
        return {
            draw: parseInt(draw),
            recordsTotal: parseInt(total),
            recordsFiltered: parseInt(filtered),
            data: rows,
        };
    }

    static async findById(id) {
        if (!id) return null;
        const row = await connection(Purchase.table)
            .where({ id })
            .first();
        return row || null;
    }
    
    static async listItem(data = {}) {
        const id = data.id ?? null;

        if (!id) {
            return {
                status: false,
                msg: 'Restrição: O ID da compra é obrigatório!',
                data: []
            };
        }

        try {
            // Busca os dados da compra
            const purchase = await connection(Purchase.table)
                .where({ id })
                .first();

            if (!purchase) {
                return {
                    status: false,
                    msg: 'Restrição: Compra não encontrada!',
                    data: []
                };
            }

            // Busca os itens da compra
            const items = await connection('item_purchase')
                .where({ id_compra: id })
                .orderBy('id', 'asc');

            return {
                status: true,
                msg: 'Itens listados com sucesso!',
                purchase: purchase,
                data: items
            };

        } catch (error) {
            return {
                status: false,
                msg: 'Restrição: ' + error.message,
                data: []
            };
        }
    }

    static async insert(data) {
        // Converte para número pois o select2 envia como string
        const id_fornecedor = data.id_fornecedor ? Number(data.id_fornecedor) : null;

        try {
            const clean = {
                id_fornecedor: id_fornecedor,
                total_bruto: 0,
                total_liquido: 0,
                desconto: 0,
                acrescimo: 0,
                observacao: data.observacao || '',
                estado_compra: 'EM_ANDAMENTO'
            };

            const response = await connection(Purchase.table)
                .insert(clean)
                .returning('id');

            if (!response || response.length === 0) {
                return {
                    status: false,
                    msg: 'Restrição: Falha ao inserir a compra!',
                    id: 0
                };
            }

            return {
                status: true,
                msg: 'Compra inserida com sucesso!',
                id: response[0].id ?? response[0]
            };

        } catch (error) {
            return {
                status: false,
                msg: 'Restrição: ' + error.message,
                id: 0
            };
        }
    }

    static async insertItem(data) {
        const id = data.id ?? null;
        const id_produto = data.id_produto ?? null;
        const quantidade = data.quantidade ?? null;

        if (id === null || id === undefined) {
            return {
                status: false,
                msg: 'Restrição: O ID da compra é obrigatório!',
                id: 0
            };
        }

        if (id_produto === null || id_produto === undefined) {
            return {
                status: false,
                msg: 'Restrição: O ID do produto é obrigatório!',
                id: 0
            };
        }

        try {
            const produto = await connection('product')
                .where({ id: id_produto })
                .first();

            if (!produto) {
                return {
                    status: false,
                    msg: 'Restrição: Nenhum produto localizado!',
                    id: 0
                };
            }

            const qtd = parseFloat(data.quantidade) || 1;
            const preco = parseFloat(data.inputPreco) || parseFloat(produto.preco_compra) || 0;
            const preco_unit = parseFloat(data.inputPreco) || 0;
            const total = parseFloat(data.inputTotal) || (preco * qtd);

            const clean = {
                id_compra: id,
                id_produto: id_produto,
                quantidade: qtd,
                total_bruto: total,
                total_liquido: total,
                preco_unitario: preco_unit,
                desconto: 0,
                acrescimo: 0,
                nome: produto.nome
            };
            const isInserted = await connection('item_purchase')
                .insert(clean)
                .returning('id');

            if (!isInserted || isInserted.length === 0) {
                return {
                    status: false,
                    msg: 'Restrição: Falha ao inserir o item da compra!',
                    id: 0
                };
            }

            // Soma os totais de todos os itens para atualizar o total da compra
            const totais = await connection('item_purchase')
                .where({ id_compra: id })
                .sum({ total_bruto: 'total_bruto', total_liquido: 'total_liquido' })
                .first();

            // Atualiza o total da compra
            await connection(Purchase.table)
                .where({ id })
                .update({
                    total_bruto: totais.total_bruto ?? 0,
                    total_liquido: totais.total_liquido ?? 0
                });

            return {
                status: true,
                msg: 'Item inserido com sucesso!',
                id: isInserted[0].id ?? isInserted[0],
                data: totais
            };

        } catch (error) {
            return {
                status: false,
                msg: 'Restrição: ' + error.message,
                id: 0
            };
        }
    }

    static async update(id, data) {
        try {
            const clean = Purchase.#sanitize(data);
            const affectedRows = await connection(Purchase.table)
                .where({ id })
                .update(clean);
            return {
                status: affectedRows > 0,
                msg: affectedRows > 0 ? 'Compra atualizada com sucesso!' : 'Nenhum registro alterado.'
            };
        } catch (error) {
            return { status: false, msg: 'Restrição: ' + error.message };
        }
    }

    static async deleteItem(id) {

        if (!id) {
            return {
                status: false,
                msg: 'Restrição: O ID do item é obrigatório!',
            };
        }

        try {
            // Busca o item antes de deletar para saber o id_compra
            const item = await connection('item_purchase')
                .where({ id })
                .first();

            if (!item) {
                return {
                    status: false,
                    msg: 'Restrição: Item não encontrado!',
                };
            }

            const id_compra = item.id_compra;

            // Deleta o item
            const deleted = await connection('item_purchase')
                .where({ id })
                .del();

            if (!deleted) {
                return {
                    status: false,
                    msg: 'Restrição: Falha ao excluir o item da compra!',
                };
            }

            // Recalcula os totais dos itens restantes
            const totais = await connection('item_purchase')
                .where({ id_compra })
                .sum({ total_bruto: 'total_bruto', total_liquido: 'total_liquido' })
                .first();

            // Atualiza o total da compra (zera se não houver mais itens)
            await connection(Purchase.table)
                .where({ id: id_compra })
                .update({
                    total_bruto: totais.total_bruto ?? 0,
                    total_liquido: totais.total_liquido ?? 0
                });

            return {
                status: true,
                msg: 'Item excluído com sucesso!',
            };

        } catch (error) {
            return {
                status: false,
                msg: 'Restrição: ' + error.message,
            };
        }
    }

    static #sanitize(data) {
        const ignore = ['id', 'acao', 'pesquisa', 'inputPreco', 'inputQuantidade', 'inputTotal'];

        const clean = {};
        for (const [key, value] of Object.entries(data)) {
            if (ignore.includes(key)) continue;
            if (value === '' || value === null || value === undefined) continue;
            if (value === 'true') { clean[key] = true; continue; }
            if (value === 'false') { clean[key] = false; continue; }
            clean[key] = value;
        }
        return clean;
    }
}
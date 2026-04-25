import connection from '../database/Connection.js';

export default class Purchase {
    // Tabela no banco
    static table = 'purchase';
    // Mapeamento: índice da coluna no DataTable → nome no banco
    static #columns = ['id', 'id_fornecedor', 'total_bruto', 'total_liquido', 'desconto', 'acrescimo', 'observacao', 'created_at', 'updated_at', null];
    // Colunas pesquisáveis pelo termo de busca
    static #searchable = ['id_fornecedor', 'total_bruto', 'total_liquido', 'desconto', 'acrescimo', 'observacao'];

    // Implementamos a pesquisa completa para a compra
    static async find(data = {}) {
        const { term = '', limit = 10, offset = 0, orderType = 'asc', column = 0, draw = 1 } = data;
        // Total sem filtro
        const [{ count: total }] = await connection(Purchase.table).count('id as count');
        // Monta WHERE da busca
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
        // Total filtrado
        const filteredQ = connection(Purchase.table).count('id as count');
        applySearch(filteredQ);
        const [{ count: filtered }] = await filteredQ;
        // Dados paginados
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

    // Retorna apenas uma compra pelo seu ID
    static async findById(id) {
        if (!id) return null;
        const row = await connection(Purchase.table)
            .where({ id })
            .first();
        return row || null;
    }

    // Insere uma nova compra
    static async insert(data) {
        try {
            console.log(data);
            const id_fornecedor = data.fornecedor_id ?? null;
            const total_bruto = 0;
            const total_liquido = 0;


            const clean = {
                id_fornecedor: id_fornecedor,
                total_bruto: total_bruto,
                total_liquido: total_liquido
            }
            const response = await connection(Purchase.table).insert(clean).returning('*');
            return { status: true, msg: 'Compra inserida com sucesso!', id: response[0].id, data: response };
        } catch (error) {
            return { status: false, error: error.message };
        }
    }

    // Insere um item na compra, atualizando os totais da compra
    static async insertItem(data) {
        const id = data.id ?? null;
        const id_produto = data.pesquisa ?? null;
        const quantidade = data.quantidade ?? 1;

        // Verifica se o id da compra está vazio ou nulo
        if (id === null || id === undefined) {
            return {
                status: false,
                msg: 'Restrição: O ID da compra é obrigatório!',
                id: 0
            };
        }

        // Verifica se o id do produto está vazio ou nulo
        if (id_produto === null || id_produto === undefined) {
            return {
                status: false,
                msg: 'Restrição: O ID do produto é obrigatório!',
                id: 0
            };
        }

        try {
            // Seleciona o produto que está sendo vendido
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

            const FieldAndValue = {
                id_compra: id,
                id_produto: id_produto,
                quantidade: quantidade,
                total_bruto: produto.valor,
                total_liquido: produto.valor,
                desconto: 0,
                acrescimo: 0,
                nome: produto.nome
            };


            // Insere o item na compra
            const isInserted = await connection('item_purchase')
                .insert(FieldAndValue).returning('id');

            if (!isInserted) {
                return {
                    status: false,
                    msg: 'Restrição: Falha ao inserir o item da venda!',
                    id: 0
                };
            }

            // Soma os totais de todos os itens da compra para atualizar o total da compra
            const total_purchase = await connection('vw_item_purchase')
                .where({ id_compra: id })
                .first();

            // Atualiza o total da compra
            await connection('purchase')
                .where({ id })
                .update({
                    total_bruto: total_purchase.total_bruto,
                    total_liquido: total_purchase.total_liquido
                });

            return {
                status: true,
                msg: 'Item inserido com sucesso!',
                id: isInserted[0],
                data: total_purchase
            };

        } catch (error) {
            return {
                status: false,
                msg: 'Restrição: ' + error.message,
                id: 0
            };
        }
    }

    // Atualiza uma compra pelo ID
    static async update(id, data) {
        try {
            const affectedRows = await connection(Purchase.table).where({ id }).update(data);
            return { status: affectedRows > 0 };
        } catch (error) {
            return { status: false, error: error.message };
        }
    }

    // Deleta uma compra pelo ID
    static async delete(id) {
        try {
            const affectedRows = await connection(Purchase.table).where({ id }).del();
            return { status: affectedRows > 0 };
        } catch (error) {
            return { status: false, error: error.message };
        }
    }

    //Remove campos vazios e converte tipos.
    static #sanitize(data) {
        // Campos de controle do form — não existem no banco
        const ignore = ['id', 'action'];

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
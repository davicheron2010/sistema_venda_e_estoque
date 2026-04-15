import connection from '../database/Connection.js';
export default class Product {
    // Tabela no banco
    static table = 'product';
    // Mapeamento: índice da coluna no DataTable → nome no banco
    static #columns = ['id', 'nome', 'codigo_barra', 'unidade', 'preco_compra', 'total_imposto','margem_lucro', 'custo_operacional','valor_venda_sugerido', 'preco_venda','descricao','ativo','excluido', null];
    // Colunas pesquisáveis pelo termo de busca
    static #searchable = ['nome', 'codigo_barra', 'unidade', 'descricao', 'preco_compra', 'preco_venda'];
    //Implementamos a pesquisa completa para o produto
    static async find(data = {}) {
        const { term = '', limit = 10, offset = 0, orderType = 'asc', column = 0, draw = 1 } = data;
        //Total sem filtro
        const [{ count: total }] = await connection(Product.table).count('id as count');
        //Monta WHERE da busca
        const search = term?.trim();
        function applySearch(query) {
            if (search) {
                query.where(function () {
                    for (const col of Product.#searchable) {
                        this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${search}%`]);
                    }
                });
            }
            return query;
        }
        // Total filtrado
        const filteredQ = connection(Product.table).count('id as count');
        applySearch(filteredQ);
        const [{ count: filtered }] = await filteredQ;
        // Dados paginados
        const orderColumn = Product.#columns[column] || 'id';
        const orderDir = orderType === 'desc' ? 'desc' : 'asc';
        const dataQ = connection(Product.table).select('*');
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
    //Retorna apenas um produto pelo seu ID
    static async findById(id) {
        if (!id) return null;
        const row = await connection(Product.table)
            .where({ id })
            .first();
        return row || null;
    }
}
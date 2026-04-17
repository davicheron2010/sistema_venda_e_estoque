import connection from '../database/Connection.js';

export default class Product {
    // Tabela no banco de dados
    static table = 'product';

    // Mapeamento: índice da coluna (DataTable) → nome no banco
    static #columns = ['id', 'nome', 'codigo_barra', 'grupo',  'unidade', 'preco_compra', 'preco_venda', 'ativo', null];

    // Colunas pesquisáveis pelo termo de busca
    static #searchable = ['nome', 'codigo_barra', 'grupo', 'unidade'];

    /**
     * Pesquisa de produtos (Compatível com Select2 e DataTables)
     */
    static async find(data = {}) {
        const {
            search = '', 
            term = '',
            q = '', 
            limit = 10,
            offset = 0,
            orderType = 'asc',
            column = 0,
            draw = 1,
        } = data;

        // Consolida o termo de busca de todas as fontes possíveis
        const searchTerm = (search || term || q || '').trim();

        try {
            // 1. Contagem total sem filtros
            const [{ count: total }] = await connection(Product.table).count('id as count');

            // 2. Função interna para aplicar os filtros de busca (ILIKE para Postgres)
            const applySearch = (query) => {
                if (searchTerm) {
                    query.where(function () {
                        for (const col of Product.#searchable) {
                            this.orWhere(col, 'ilike', `%${searchTerm}%`);
                        }
                    });
                }
                return query;
            };

            // 3. Contagem de registros filtrados
            const filteredQ = connection(Product.table).count('id as count');
            applySearch(filteredQ);
            const [{ count: filtered }] = await filteredQ;

            // 4. Busca dos dados paginados
            const orderColumn = Product.#columns[column] || 'nome';
            const orderDir = orderType === 'desc' ? 'desc' : 'asc';

            const dataQ = connection(Product.table).select('*');
            applySearch(dataQ);
            
            const rows = await dataQ
                .orderBy(orderColumn, orderDir)
                .limit(parseInt(limit))
                .offset(parseInt(offset));

            // 5. Formatação de retorno
            const formattedRows = rows.map(row => ({
                ...row,
                supplier: { nome: '—' },
                group: { nome: '—' }
            }));

            return {
                draw: parseInt(draw),
                recordsTotal: parseInt(total),
                recordsFiltered: parseInt(filtered),
                data: formattedRows,
            };
        } catch (error) {
            console.error("Erro no Product.find:", error);
            return { draw: 1, recordsTotal: 0, recordsFiltered: 0, data: [] };
        }
    }

    /**
     * Insere um novo produto
     */
    static async insert(data) {
        if (!data.nome || data.nome.trim() === '') {
            return { status: false, msg: 'O campo nome é obrigatório' };
        }
        try {
            const clean = Product.#sanitize(data);
            const [result] = await connection(Product.table).insert(clean).returning('*');
            return { status: true, msg: 'Produto cadastrado com sucesso!', id: result.id, data: [result] };
        } catch (err) {
            return { status: false, msg: 'Erro ao inserir: ' + err.message };
        }
    }

    /**
     * Atualiza um produto existente
     */
    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };
        try {
            const clean = Product.#sanitize(data);
            delete clean.id;
            const [result] = await connection(Product.table).where({ id }).update(clean).returning('*');
            return { status: true, msg: 'Produto atualizado!', id: result.id, data: [result] };
        } catch (err) {
            return { status: false, msg: 'Erro ao atualizar: ' + err.message };
        }
    }

    /**
     * Exclui um produto
     */
    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };
        try {
            await connection(Product.table).where({ id }).del();
            return { status: true, msg: 'Produto removido com sucesso!' };
        } catch (err) {
            return { status: false, msg: 'Erro ao excluir: ' + err.message };
        }
    }

    /**
     * Busca um único produto pelo ID
     */
    static async findById(id) {
        if (!id) return null;
        try {
            return await connection(Product.table).where({ id }).first() || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Remove campos desnecessários e trata booleanos
     */
    static #sanitize(data) {
        const ignore = ['id', 'action'];
        const clean = {};
        for (const [key, value] of Object.entries(data)) {
            if (ignore.includes(key)) continue;
            if (value === '' || value === null || value === undefined) continue;
            if (value === 'true' || value === true) { clean[key] = true; continue; }
            if (value === 'false' || value === false) { clean[key] = false; continue; }
            clean[key] = value;
        }
        return clean;
    }
}
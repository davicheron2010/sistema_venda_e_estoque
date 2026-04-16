import connection from '../database/Connection.js';
export default class Product {
    // Tabela no banco
    static table = 'product';

    // Mapeamento: índice da coluna no DataTable → nome no banco
    static #columns = ['id', 'nome', 'codigo_barra', 'unidade', 'preco_compra', 'preco_venda', 'ativo', null];

    // Colunas pesquisáveis pelo termo de busca
    static #searchable = ['nome', 'codigo_barra', 'unidade', 'preco_compra', 'preco_venda'];

    //Insere um novo cliente.
    static async insert(data) {

        if (!data.nome || data.nome.trim() === '') {
            return { status: false, msg: 'O campo nome é obrigatório', id: null, data: [] };
        }

        try {

            const clean = Product.#sanitize(data);

            const [result] = await connection(Product.table)
                .insert(clean)
                .returning('*');

            return { status: true, msg: 'Salvo com sucesso!', id: result.id, data: [result] };

        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message, id: null, data: [] };
        }
    }

    //Implementamos a pesquisa completa para o cliente
    static async find(data = {}) {
        const {
            term = '',
            limit = 10,
            offset = 0,
            orderType = 'asc',
            column = 0,
            draw = 1,
        } = data;

        //Total sem filtro
        const [{ count: total }] = await connection(Product.table)
            .count('id as count');

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

    //Implementamos a exclusão cliente
    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };

        try {
            await connection(Product.table).where({ id }).del();
            return { status: true, msg: 'Excluído com sucesso!' };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    //Implementamos a função de alterar o cadastro
    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório', data: [] };

        if (!data.nome || data.nome.trim() === '') {
            return { status: false, msg: 'O campo nome é obrigatório', data: [] };
        }

        try {
            const clean = Product.#sanitize(data);

            // Remove o id do objeto para não tentar atualizar a PK
            delete clean.id;

            const [result] = await connection(Product.table)
                .where({ id })
                .update(clean)
                .returning('*');

            if (!result) {
                return { status: false, msg: 'Produto não encontrado', data: [] };
            }

            return { status: true, msg: 'Atualizado com sucesso!', id: result.id, data: [result] };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message, data: [] };
        }
    }

    //Retorna apenas um Produto pelo seu ID
    static async findById(id) {
        if (!id) return null;

        const row = await connection(Product.table)
            .where({ id })
            .first();

        return row || null;
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
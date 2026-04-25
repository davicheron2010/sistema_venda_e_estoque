import connection from '../database/Connection.js';
export default class Product {
    static table = 'product';
    static #columns = ['id', 'nome', 'codigo_barra', 'unidade', 'grupo', 'preco_compra', 'preco_venda', 'ativo', null];
    static #searchable = ['nome', 'codigo_barra', 'unidade', 'grupo'];
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
        const searchTerm = (search || term || q || '').trim();
        try {
            const [{ count: total }] = await connection(Product.table).count('id as count');
            const applySearch = (query) => {
                if (searchTerm) {
                    query.where(function () {
                        for (const col of Product.#searchable) {
                            this.orWhere(`${Product.table}.${col}`, 'ilike', `%${searchTerm}%`);
                        }
                    });
                }
                return query;
            };
            const filteredQ = connection(Product.table).count(`${Product.table}.id as count`);
            applySearch(filteredQ);
            const [{ count: filtered }] = await filteredQ;
            const orderColumn = Product.#columns[column] || 'nome';
            const orderDir = orderType === 'desc' ? 'desc' : 'asc';
            const dataQ = connection(Product.table)
                .select(`${Product.table}.*`)
                .select(connection.raw('COALESCE(mvw.estoque_atual, 0) AS estoque_atual'))
                .leftJoin('mvw_estoque as mvw', 'mvw.id_produto', `${Product.table}.id`);
            applySearch(dataQ);
            const rows = await dataQ
                .orderBy(orderColumn, orderDir)
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            return {
                draw: parseInt(draw),
                recordsTotal: parseInt(total),
                recordsFiltered: parseInt(filtered),
                data: rows,
            };
        } catch (error) {
            console.error("Erro no Product.find:", error);
            return { draw: 1, recordsTotal: 0, recordsFiltered: 0, data: [] };
        }
    }
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
    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };
        try {
            await connection(Product.table).where({ id }).del();
            return { status: true, msg: 'Produto removido com sucesso!' };
        } catch (err) {
            return { status: false, msg: 'Erro ao excluir: ' + err.message };
        }
    }
    static async findById(id) {
        if (!id) return null;
        try {
            return await connection(Product.table).where({ id }).first() || null;
        } catch (error) {
            return null;
        }
    }
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
    static async productSearch(data = {}) {
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

        console.log(term);
    }
}
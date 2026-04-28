import connection from '../database/Connection.js';

export default class Supplier {
    static table = 'supplier';

    // 🔹 Colunas do DataTable
    static #columns = ['id', 'nome_fantasia', 'razao_social', 'cnpj_cpf', 'ie_rg', null];

    // 🔹 Campos pesquisáveis
    static #searchable = ['nome_fantasia', 'razao_social', 'cnpj_cpf', 'ie_rg'];

    // 🔹 INSERT
    static async insert(data) {

        if (!data.nome_fantasia || data.nome_fantasia.trim() === '') {
            return { status: false, msg: 'O campo nome fantasia é obrigatório', data: [] };
        }

        try {
            const clean = Supplier.#sanitize(data);

            await connection(Supplier.table).insert(clean);

            const result = await connection(Supplier.table)
                .orderBy('id', 'desc')
                .first();

            return { status: true, msg: 'Salvo com sucesso!', id: result.id, data: [result] };

        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message, data: [] };
        }
    }

    // 🔹 FIND (DataTable)
    static async find(data = {}) {
        const { term = '', limit = 10, offset = 0, orderType = 'asc', column = 0, draw = 1 } = data;

        const [{ count: total }] = await connection(Supplier.table).count('id as count');

        const search = term?.trim();

        function applySearch(query) {
            if (search) {
                query.where(function () {
                    for (const col of Supplier.#searchable) {
                        this.orWhere(col, 'like', `%${search}%`);
                    }
                });
            }
            return query;
        }

        const filteredQ = connection(Supplier.table).count('id as count');
        applySearch(filteredQ);
        const [{ count: filtered }] = await filteredQ;

        const orderColumn = Supplier.#columns[column] || 'id';
        const orderDir = orderType === 'desc' ? 'desc' : 'asc';

        const dataQ = connection(Supplier.table).select('*');
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

    // 🔹 DELETE
    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };

        try {
            const deleted = await connection(Supplier.table).where({ id }).del();

            if (!deleted) {
                return { status: false, msg: 'Fornecedor não encontrado' };
            }

            return { status: true, msg: 'Excluído com sucesso!' };

        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    // 🔹 UPDATE
    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório', data: [] };

        if (!data.nome_fantasia || data.nome_fantasia.trim() === '') {
            return { status: false, msg: 'O campo nome fantasia é obrigatório', data: [] };
        }

        try {
            const clean = Supplier.#sanitize(data);

            delete clean.id;

            await connection(Supplier.table)
                .where({ id })
                .update(clean);

            const result = await connection(Supplier.table)
                .where({ id })
                .first();

            if (!result) {
                return { status: false, msg: 'Fornecedor não encontrado', data: [] };
            }

            return { status: true, msg: 'Atualizado com sucesso!', id: result.id, data: [result] };

        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message, data: [] };
        }
    }
    static async supplierSearch({ q = '' }) {
        const search = q.trim();

        const query = connection(Supplier.table).select('id', 'razao_social', 'nome_fantasia', 'cnpj_cpf');

        if (search !== '') {
            data: await query.where(function () {
                this.where('razao_social', 'ilike', `%${search}%`)
                    .orWhere('nome_fantasia', 'ilike', `%${search}%`);
            })
        }
        query.limit(10).offset(0).orderBy('nome_fantasia', 'asc');

        const rows = await query;

        return {
            draw: 10,
            recordsTotal: 10,
            recordsFiltered: 10,
            data: rows,
        };
    }

    // 🔹 FIND BY ID
    static async findById(id) {
        if (!id) return null;

        const row = await connection(Supplier.table)
            .where({ id })
            .first();

        return row || null;
    }

    // 🔹 SANITIZE
    static #sanitize(data) {
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
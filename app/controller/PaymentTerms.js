import connection from '../database/Connection.js';

export default class PaymentTerms {
    static table = 'payment_terms';

    static #columns = ['id', 'codigo', 'titulo', 'atalho'];
    static #searchable = ['codigo', 'titulo', 'atalho'];

    static async find(data = {}) {
        const { term = '', q = '', limit = 100, offset = 0, orderType = 'asc', column = 0, draw = 1 } = data;

        const searchTerm = (term || q || '').trim();

        try {
            const [{ count: total }] = await connection(PaymentTerms.table).count('id as count');

            const applySearch = (query) => {
                if (searchTerm) {
                    query.where(function () {
                        for (const col of PaymentTerms.#searchable) {
                            this.orWhere(col, 'like', `%${searchTerm}%`);
                        }
                    });
                }
                return query;
            };

            const filteredQ = connection(PaymentTerms.table).count('id as count');
            applySearch(filteredQ);
            const [{ count: filtered }] = await filteredQ;

            const orderColumn = PaymentTerms.#columns[column] || 'titulo';
            const orderDir = orderType === 'desc' ? 'desc' : 'asc';

            const dataQ = connection(PaymentTerms.table).select('*');
            applySearch(dataQ);
            const rows = await dataQ.orderBy(orderColumn, orderDir).limit(parseInt(limit)).offset(parseInt(offset));

            return {
                draw: parseInt(draw),
                recordsTotal: parseInt(total),
                recordsFiltered: parseInt(filtered),
                data: rows,
            };
        } catch (error) {
            console.error('Erro no PaymentTerms.find:', error);
            return { draw: 1, recordsTotal: 0, recordsFiltered: 0, data: [] };
        }
    }

    static async insert(data) {
        if (!data.titulo || data.titulo.trim() === '') {
            return { status: false, msg: 'O campo título é obrigatório' };
        }
        try {
            await connection(PaymentTerms.table).insert({
                codigo:           data.codigo || '',
                titulo:           data.titulo,
                atalho:           data.atalho || '',
                data_cadastro:    new Date(),
                data_atualizacao: new Date(),
            });
            const result = await connection(PaymentTerms.table).orderBy('id', 'desc').first();
            return { status: true, msg: 'Salvo com sucesso!', id: result.id, data: [result] };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };
        try {
            await connection(PaymentTerms.table).where({ id }).update({
                codigo:           data.codigo || '',
                titulo:           data.titulo,
                atalho:           data.atalho || '',
                data_atualizacao: new Date(),
            });
            const result = await connection(PaymentTerms.table).where({ id }).first();
            return { status: true, msg: 'Atualizado com sucesso!', id: result.id, data: [result] };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };
        try {
            await connection(PaymentTerms.table).where({ id }).del();
            return { status: true, msg: 'Excluído com sucesso!' };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    static async findById(id) {
        if (!id) return null;
        return await connection(PaymentTerms.table).where({ id }).first() || null;
    }
    static async findWithInstallments(id) {
    if (!id) return null;
    try {
        const term = await connection(PaymentTerms.table).where({ id }).first();
        if (!term) return null;

        const installments = await connection('installment')
            .where({ id_pagamento: id })
            .orderBy('parcela', 'asc');

        return { ...term, installments };
    } catch (error) {
        console.error('Erro no findWithInstallments:', error);
        return null;
    }
}
}

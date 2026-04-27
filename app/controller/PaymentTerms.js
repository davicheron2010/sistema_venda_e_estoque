import connection from '../database/Connection.js';

export default class PaymentTerms {
    static table = 'payment_terms';
    static #columns = ['id', 'codigo', 'titulo', 'atalho'];
    static #searchable = ['codigo', 'titulo', 'atalho'];

    static async find(data = {}) {
        const {
            term = '',
            q = '',
            limit = 100,
            offset = 0,
            orderType = 'asc',
            column = 0,
            draw = 1
        } = data;

        const searchTerm = String(term || q || '').trim();

        try {
            const [{ count: total }] = await connection(PaymentTerms.table).count('id as count');

            const applySearch = (query) => {
                if (searchTerm) {
                    query.where(function () {
                        for (const col of PaymentTerms.#searchable) {
                            this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${searchTerm}%`]);
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

            const rows = await applySearch(connection(PaymentTerms.table).select('*'))
                .orderBy(orderColumn, orderDir)
                .limit(parseInt(limit) || 100)
                .offset(parseInt(offset) || 0);

            return {
                draw: parseInt(draw) || 1,
                recordsTotal: Number(total) || 0,
                recordsFiltered: Number(filtered) || 0,
                data: rows,
                status: true
            };
        } catch (error) {
            console.error('Erro no PaymentTerms.find:', error);
            return {
                draw: parseInt(draw) || 1,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
                status: false,
                msg: error.message
            };
        }
    }

    static async insert(data) {
        const titulo = String(data.titulo || '').trim();
        if (!titulo) {
            return { status: false, msg: 'O campo título é obrigatório' };
        }

        try {
            const payload = {
                codigo: data.codigo ?? null,
                titulo,
                atalho: data.atalho ?? null,
                data_cadastro: new Date(),
                data_atualizacao: new Date(),
            };

            const result = await connection(PaymentTerms.table).insert(payload).returning('id');
            const id = Array.isArray(result)
                ? (result[0]?.id ?? result[0] ?? null)
                : (result?.id ?? result ?? null);

            const row = await connection(PaymentTerms.table).where({ id }).first();

            return {
                status: true,
                msg: 'Salvo com sucesso!',
                id: Number(id),
                data: row || null
            };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };

        const titulo = String(data.titulo || '').trim();
        if (!titulo) {
            return { status: false, msg: 'O campo título é obrigatório' };
        }

        try {
            const affectedRows = await connection(PaymentTerms.table).where({ id }).update({
                codigo: data.codigo ?? null,
                titulo,
                atalho: data.atalho ?? null,
                data_atualizacao: new Date(),
            });

            if (!affectedRows) {
                return { status: false, msg: 'Nenhum registro foi atualizado' };
            }

            const row = await connection(PaymentTerms.table).where({ id }).first();

            return {
                status: true,
                msg: 'Atualizado com sucesso!',
                id: Number(id),
                data: row || null
            };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };

        try {
            const affectedRows = await connection(PaymentTerms.table).where({ id }).del();
            return {
                status: affectedRows > 0,
                msg: affectedRows > 0 ? 'Excluído com sucesso!' : 'Nenhum registro encontrado'
            };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    static async findById(id) {
        if (!id) return null;

        try {
            return await connection(PaymentTerms.table).where({ id }).first() || null;
        } catch (error) {
            console.error('Erro no PaymentTerms.findById:', error);
            return null;
        }
    }

    static async simulate(data = {}) {
        const { id, total } = data;

        if (!id || !total) {
            return { status: false, msg: 'ID do pagamento e valor total são obrigatórios.' };
        }

        try {
            // Busca as regras de parcelamento vinculadas a esta forma de pagamento
            const rules = await connection('installment')
                .where({ id_pagamento: id })
                .orderBy('parcela', 'asc');

            if (!rules || rules.length === 0) {
                return { status: true, data: [], msg: 'Sem parcelas configuradas.' };
            }

            const totalParcelas = rules.length;
            const valorParcelaBase = Math.floor((total / totalParcelas) * 100) / 100;
            const diferenca = parseFloat((total - (valorParcelaBase * totalParcelas)).toFixed(2));

            const simulation = rules.map((rule, index) => {
                const dataVencimento = new Date();
                // Adiciona o intervalo de dias definido no banco
                dataVencimento.setDate(dataVencimento.getDate() + (rule.intervalor || 0));

                return {
                    numero: rule.parcela,
                    // Se for a última parcela, adiciona a diferença do arredondamento
                    valor: index === totalParcelas - 1 ? (valorParcelaBase + diferenca) : valorParcelaBase,
                    vencimento: dataVencimento.toLocaleDateString('pt-BR'),
                    percentual: rule.percentual
                };
            });

            return {
                status: true,
                data: simulation
            };
        } catch (error) {
            console.error('Erro ao simular parcelas:', error);
            return { status: false, msg: 'Erro interno ao calcular parcelas.' };
        }
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
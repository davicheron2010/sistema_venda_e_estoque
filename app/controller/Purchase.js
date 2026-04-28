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

        if (id === null || id === undefined) {
            return { status: false, msg: 'Restrição: O ID da compra é obrigatório!', id: 0 };
        }

        if (id_produto === null || id_produto === undefined) {
            return { status: false, msg: 'Restrição: O ID do produto é obrigatório!', id: 0 };
        }

        try {
            const produto = await connection('product')
                .where({ id: id_produto })
                .first();

            if (!produto) {
                return { status: false, msg: 'Restrição: Nenhum produto localizado!', id: 0 };
            }

            const qtd = parseFloat(data.quantidade) || 1;
            const preco_unit = parseFloat(data.inputPreco) || 0;
            const total = parseFloat(data.inputTotal) || (preco_unit * qtd);

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
                return { status: false, msg: 'Restrição: Falha ao inserir o item da compra!', id: 0 };
            }

            const totais = await connection('item_purchase')
                .where({ id_compra: id })
                .sum({ total_bruto: 'total_bruto', total_liquido: 'total_liquido' })
                .first();

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
            return { status: false, msg: 'Restrição: ' + error.message, id: 0 };
        }
    }

    /**
     * Finaliza a compra salvando as parcelas de cada forma de pagamento.
     *
     * @param {object} data
     * @param {number} data.id_purchase       - ID da compra
     * @param {Array}  data.formas            - Array com até 2 formas de pagamento
     * @param {number} data.formas[].id_payment_terms
     * @param {number} data.formas[].parcelas - Número de parcelas escolhido
     * @param {number} data.formas[].valor    - Valor total desta forma
     * @param {Array}  data.formas[].installments - [{ id, parcela, intervalo }] vindos da tabela installment
     */
    static async finalize(data) {
        const { id_purchase, formas } = data;

        if (!id_purchase) {
            return { status: false, msg: 'Restrição: ID da compra é obrigatório!' };
        }

        if (!formas || formas.length === 0) {
            return { status: false, msg: 'Restrição: Nenhuma forma de pagamento informada!' };
        }

        try {
            await connection.transaction(async (trx) => {

                // Remove parcelas antigas desta compra caso já existam
                await trx('installment_sale_purchase')
                    .where({ id_purchase })
                    .del();

                const hoje = new Date();
                const registros = [];

                for (const forma of formas) {
                    const { id_payment_terms, parcelas, valor, installments } = forma;

                    const valorBase = Math.floor((valor / parcelas) * 100) / 100;
                    const soma = valorBase * parcelas;
                    const diferenca = parseFloat((valor - soma).toFixed(2));

                    for (let i = 1; i <= parcelas; i++) {
                        const valorParcela = i === parcelas ? valorBase + diferenca : valorBase;

                        const instData = installments.find(inst => inst.parcela === i);
                        const intervalo = instData?.intervalo ?? (i * 30);
                        const id_installment = instData?.id ?? null;

                        const vencimento = new Date(hoje);
                        vencimento.setDate(vencimento.getDate() + intervalo);

                        registros.push({
                            id_sale: null,
                            id_purchase: Number(id_purchase),
                            id_installment: id_installment,
                            id_payment_terms: Number(id_payment_terms),
                            total_parcelas: parcelas,
                            numero_parcela: i,
                            valor_parcela: valorParcela,
                            valor_total: valor,
                            status: 'aberto',
                            data_vencimento: vencimento,
                            data_cadastro: new Date(),
                            data_atualizacao: new Date()
                        });
                    }
                }

                await trx('installment_sale_purchase').insert(registros);

                await trx(Purchase.table)
                    .where({ id: id_purchase })
                    .update({
                        estado_compra: 'RECEBIDO',
                        data_atualizacao: new Date()
                    });
            });

            return { status: true, msg: 'Compra finalizada com sucesso!' };

        } catch (error) {
            return { status: false, msg: 'Restrição: ' + error.message };
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

    static async delete(id) {
        if (!id) {
            return { status: false, msg: 'Restrição: O ID da compra é obrigatório!' };
        }

        try {
            await connection('item_purchase')
                .where({ id_compra: id })
                .del();

            const deleted = await connection(Purchase.table)
                .where({ id })
                .del();

            if (!deleted) {
                return { status: false, msg: 'Restrição: Falha ao excluir a compra!' };
            }

            return { status: true, msg: 'Compra excluída com sucesso!' };

        } catch (error) {
            return { status: false, msg: 'Restrição: ' + error.message };
        }
    }

    static async deleteItem(id) {
        if (!id) {
            return { status: false, msg: 'Restrição: O ID do item é obrigatório!' };
        }

        try {
            const item = await connection('item_purchase')
                .where({ id })
                .first();

            if (!item) {
                return { status: false, msg: 'Restrição: Item não encontrado!' };
            }

            const id_compra = item.id_compra;

            const deleted = await connection('item_purchase')
                .where({ id })
                .del();

            if (!deleted) {
                return { status: false, msg: 'Restrição: Falha ao excluir o item da compra!' };
            }

            const totais = await connection('item_purchase')
                .where({ id_compra })
                .sum({ total_bruto: 'total_bruto', total_liquido: 'total_liquido' })
                .first();

            await connection(Purchase.table)
                .where({ id: id_compra })
                .update({
                    total_bruto: totais.total_bruto ?? 0,
                    total_liquido: totais.total_liquido ?? 0
                });

            return { status: true, msg: 'Item excluído com sucesso!' };

        } catch (error) {
            return { status: false, msg: 'Restrição: ' + error.message };
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
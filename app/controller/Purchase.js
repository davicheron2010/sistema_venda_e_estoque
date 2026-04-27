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

            /**
             * CORREÇÃO: O erro "p.id_fornecedor does not exist" 
             * ocorre porque o fornecedor está vinculado à COMPRA (purchase), não ao produto (product).
             * O JOIN foi ajustado para buscar o nome do fornecedor através da tabela purchase (pur).
             */
            const items = await connection('item_purchase as i')
                .leftJoin('product as p', 'i.id_produto', 'p.id')
                .leftJoin('purchase as pur', 'i.id_compra', 'pur.id')
                .leftJoin('supplier as s', 'pur.id_fornecedor', 's.id')
                .leftJoin('product_group as g', 'p.id_grupo', 'g.id')
                .select('i.*', 's.nome as fornecedor', 'g.nome as grupo')
                .where({ 'i.id_compra': id })
                .orderBy('i.id', 'asc');

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
        // CORREÇÃO: Garante que o ID do fornecedor seja tratado corretamente desde o início
        const id_fornecedor = data.id_fornecedor ? Number(data.id_fornecedor) : null;

        try {
            const clean = {
                id_fornecedor: id_fornecedor,
                total_bruto: 0,
                total_liquido: 0,
                desconto: 0,
                acrescimo: 0,
                observacao: data.observacao || '',
                estado_compra: 'EM_ANDAMENTO',
                data_cadastro: new Date(),
                data_atualizacao: new Date()
            };

            const [response] = await connection(Purchase.table)
                .insert(clean)
                .returning('id');

            // CORREÇÃO: Tratamento para diferentes retornos de drivers do Knex
            const newId = typeof response === 'object' ? response.id : response;

            return {
                status: true,
                msg: 'Compra iniciada com sucesso!',
                id: newId
            };

        } catch (error) {
            return { status: false, msg: 'Restrição ao inserir: ' + error.message, id: 0 };
        }
    }

    static async insertItem(data) {
        const id = data.id ?? null;
        const id_produto = data.pesquisa ?? null;
        const quantidade = parseFloat(data.inputQuantidade) || 1;
        const preco_unitario = parseFloat(data.inputPreco) || 0;

        if (!id || !id_produto) {
            return { status: false, msg: 'Restrição: ID da compra e produto são obrigatórios!', id: 0 };
        }

        try {
            const produto = await connection('product')
                .where({ id: id_produto })
                .first();

            if (!produto) {
                return { status: false, msg: 'Restrição: Nenhum produto localizado!', id: 0 };
            }

            const total_item = quantidade * preco_unitario;

            const clean = {
                id_compra: id,
                id_produto: id_produto,
                quantidade: quantidade,
                total_bruto: total_item,
                total_liquido: total_item,
                desconto: 0,
                acrescimo: 0,
                nome: produto.nome
            };

            const isInserted = await connection('item_purchase')
                .insert(clean)
                .returning('id');

            const totais = await connection('item_purchase')
                .where({ id_compra: id })
                .sum({ total_bruto: 'total_bruto', total_liquido: 'total_liquido' })
                .first();

            await connection(Purchase.table)
                .where({ id })
                .update({
                    total_bruto: totais.total_bruto ?? 0,
                    total_liquido: totais.total_liquido ?? 0,
                    data_atualizacao: new Date()
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

    static async update(id, data) {
        try {
            const clean = Purchase.#sanitize(data);
            clean.data_atualizacao = new Date();

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
        if (!id) return { status: false, msg: 'Restrição: ID do item é obrigatório!' };

        try {
            const item = await connection('item_purchase').where({ id }).first();
            if (!item) return { status: false, msg: 'Restrição: Item não encontrado!' };

            const id_compra = item.id_compra;

            await connection('item_purchase').where({ id }).del();

            const totais = await connection('item_purchase')
                .where({ id_compra })
                .sum({ total_bruto: 'total_bruto', total_liquido: 'total_liquido' })
                .first();

            await connection(Purchase.table)
                .where({ id: id_compra })
                .update({
                    total_bruto: totais.total_bruto ?? 0,
                    total_liquido: totais.total_liquido ?? 0,
                    data_atualizacao: new Date()
                });

            return { status: true, msg: 'Item excluído com sucesso!' };

        } catch (error) {
            return { status: false, msg: 'Restrição: ' + error.message };
        }
    }

    static async finalize(data) {
        /**
         * CORREÇÃO CRÍTICA: Flexibilização da captura do ID.
         * O backend agora tenta pegar 'id' ou 'id_compra' para evitar o erro de validação
         * capturado nas imagens image_86da18.png e image_875215.png.
         */
        const id = data.id || data.id_compra;
        const id_payment_terms = data.id_payment_terms ?? null;
        const total = parseFloat(data.total) ?? 0;

        // Log para depuração interna se necessário
        if (!id || !id_payment_terms) {
            return {
                status: false,
                msg: `Restrição: O sistema não identificou o ID da compra (${id}) ou a Forma de Pagamento.`
            };
        }

        try {
            const purchase = await connection(Purchase.table).where({ id }).first();

            if (!purchase) {
                return { status: false, msg: 'Restrição: Compra não localizada no banco de dados.' };
            }

            if (purchase.estado_compra === 'RECEBIDO') {
                return { status: false, msg: 'Restrição: Esta compra já foi finalizada anteriormente.' };
            }

            // Busca parcelas vinculadas à forma de pagamento selecionada
            const parcelas = await connection('installment')
                .where({ id_pagamento: id_payment_terms })
                .orderBy('parcela', 'asc');

            if (!parcelas.length) {
                return { status: false, msg: 'Restrição: A forma de pagamento selecionada não possui parcelas configuradas.' };
            }

            const qtd = parcelas.length;
            const base = Math.floor((total / qtd) * 100) / 100;
            const resto = parseFloat((total - base * qtd).toFixed(2));

            // Inicia transação para garantir que tudo seja salvo ou nada seja salvo
            await connection.transaction(async (trx) => {
                for (let i = 0; i < parcelas.length; i++) {
                    const parcela = parcelas[i];
                    const valor = i === qtd - 1 ? parseFloat((base + resto).toFixed(2)) : base;

                    await trx('installment_sale_purchase').insert({
                        id_purchase: id,
                        id_sale: null, // Definido como null para compras
                        id_installment: parcela.id,
                        id_payment_terms: id_payment_terms,
                        total_parcelas: qtd,
                        valor_total: valor,
                        valor_pago_total: 0,
                        status: 'aberto',
                        data_cadastro: new Date(),
                        data_atualizacao: new Date()
                    });
                }

                // Atualiza o estado da compra para RECEBIDO (Finalizada)
                await trx(Purchase.table)
                    .where({ id })
                    .update({
                        estado_compra: 'RECEBIDO',
                        id_payment_terms: id_payment_terms, // Salva a forma de pagamento na compra
                        data_atualizacao: new Date()
                    });
            });

            return { status: true, msg: 'Compra finalizada com sucesso!' };

        } catch (error) {
            console.error("Erro ao finalizar compra:", error);
            return { status: false, msg: 'Erro interno ao processar: ' + error.message };
        }
    }

    static #sanitize(data) {
        const ignore = ['id', 'acao', 'pesquisa', 'inputPreco', 'inputQuantidade', 'inputTotal'];
        const clean = {};
        for (const [key, value] of Object.entries(data)) {
            if (ignore.includes(key)) continue;
            if (value === '' || value === null || value === undefined) continue;
            clean[key] = (value === 'true') ? true : (value === 'false' ? false : value);
        }
        return clean;
    }
}
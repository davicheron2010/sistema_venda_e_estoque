import connection from '../database/Connection.js';

export default class Purchase {
    static table = 'purchase';

    static #columns = [
        'id',
        'id_fornecedor',
        'total_bruto',
        'total_liquido',
        'desconto',
        'acrescimo',
        'observacao',
        'created_at',
        'updated_at',
    ];

    static #searchable = [
        'id_fornecedor',
        'observacao'
    ];

    static #toNumber(value, fallback = 0) {
        const n = Number(String(value ?? fallback).replace(',', '.'));
        return Number.isFinite(n) ? n : fallback;
    }

    static async find(data = {}) {
        const {
            term = '',
            limit = 10,
            offset = 0,
            orderType = 'asc',
            column = 0,
            draw = 1
        } = data;

        const search = String(term || '').trim();

        const applySearch = (query) => {
            if (search) {
                query.where(function () {
                    for (const col of Purchase.#searchable) {
                        this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${search}%`]);
                    }
                });
            }
            return query;
        };

        try {
            const totalCountResult = await connection(Purchase.table).count({ count: 'id' });
            const total = totalCountResult?.[0]?.count || 0;

            const filteredQ = connection(Purchase.table).count({ count: 'id' });
            applySearch(filteredQ);
            const filteredCountResult = await filteredQ;
            const filtered = filteredCountResult?.[0]?.count || 0;

            const orderColumn = Purchase.#columns[column] || 'id';
            const orderDir = orderType === 'desc' ? 'desc' : 'asc';

            const rows = await applySearch(connection(Purchase.table).select('*'))
                .orderBy(orderColumn, orderDir)
                .limit(parseInt(limit) || 10)
                .offset(parseInt(offset) || 0);

            return {
                status: true,
                draw: parseInt(draw) || 1,
                recordsTotal: Number(total) || 0,
                recordsFiltered: Number(filtered) || 0,
                data: rows,
            };
        } catch (error) {
            return {
                status: false,
                draw: parseInt(draw) || 1,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
                msg: error.message
            };
        }
    }

    static async findById(id) {
        if (!id) return null;

        try {
            const row = await connection('purchase as p')
                .select(
                    'p.*',
                    'f.nome_fantasia as fornecedor_nome',
                    'f.cnpj_cpf as fornecedor_documento'
                )
                .leftJoin('supplier as f', 'f.id', 'p.id_fornecedor')
                .where('p.id', id)
                .first();

            return row || null;
        } catch (error) {
            return null;
        }
    }

    static async insert(data) {
        try {
            const payload = {
                id_fornecedor: data.id_fornecedor ?? null,
                total_bruto: Purchase.#toNumber(data.total_bruto),
                total_liquido: Purchase.#toNumber(data.total_liquido),
                desconto: Purchase.#toNumber(data.desconto),
                acrescimo: Purchase.#toNumber(data.acrescimo),
                observacao: data.observacao ?? null,
            };

            const result = await connection(Purchase.table)
                .insert(payload)
                .returning('id');

            let id = null;

            if (Array.isArray(result)) {
                id = result[0]?.id ?? result[0] ?? null;
            } else if (result && typeof result === 'object') {
                id = result.id ?? null;
            } else {
                id = result ?? null;
            }

            if (!id) {
                const last = await connection(Purchase.table)
                    .select('id')
                    .orderBy('id', 'desc')
                    .first();

                id = last?.id ?? null;
            }

            return { status: true, id: Number(id) || 0 };
        } catch (error) {
            return { status: false, msg: error.message };
        }
    }

    static async insertItem(data) {
        const id = data.id_compra ?? null;
        const id_produto = data.id_produto ?? null;
        const quantidade = Purchase.#toNumber(data.quantidade, 1);
        const precoCompra = Purchase.#toNumber(data.preco_compra, 0);

        if (!id) return { status: false, msg: 'Restrição: O ID da compra é obrigatório!', id: 0 };
        if (!id_produto) return { status: false, msg: 'Restrição: O ID do produto é obrigatório!', id: 0 };

        try {
            const produto = await connection('product as p')
                .select('p.*')
                .where('p.id', id_produto)
                .first();

            if (!produto) {
                return { status: false, msg: 'Restrição: Nenhum produto localizado!', id: 0 };
            }

            const unitario = precoCompra > 0 ? precoCompra : Purchase.#toNumber(produto.preco_compra, 0);
            const total = unitario * quantidade;

            const fieldAndValue = {
                id_compra: Number(id),
                id_produto: Number(id_produto),
                quantidade,
                total_bruto: total,
                unitario_bruto: unitario,
                total_liquido: total,
                unitario_liquido: unitario,
                desconto: 0,
                acrescimo: 0,
                nome: produto.nome
            };

            const inserted = await connection('item_purchase')
                .insert(fieldAndValue)
                .returning('id');

            const itemId = Array.isArray(inserted)
                ? (inserted[0]?.id ?? inserted[0] ?? null)
                : (inserted?.id ?? inserted ?? null);

            const totalPurchase = await connection('item_purchase')
                .where({ id_compra: id })
                .sum({
                    total_bruto: 'total_bruto',
                    total_liquido: 'total_liquido'
                })
                .first();

            await connection('purchase')
                .where({ id })
                .update({
                    total_bruto: Number(totalPurchase?.total_bruto || 0),
                    total_liquido: Number(totalPurchase?.total_liquido || 0),
                    estado_compra: 'RECEBIDO',
                    updated_at: new Date()
                });

            return {
                status: true,
                msg: 'Item inserido com sucesso!',
                id: Number(itemId) || 0,
                data: {
                    ...fieldAndValue,
                    grupo_nome: produto.grupo || '-',
                    grupo_id: null,
                    produto_nome: produto.nome,
                    codigo_barra: produto.codigo_barra || null
                }
            };
        } catch (error) {
            return {
                status: false,
                msg: 'Restrição: ' + error.message,
                id: 0
            };
        }
    }

    static async listItemPurchase(data) {
        try {
            const id = data?.id ?? null;
            if (!id) {
                return { status: false, msg: 'ID da compra é obrigatório!', data: [], purchase: {} };
            }

            const items = await connection('item_purchase as ip')
                .select(
                    'ip.*',
                    'p.codigo_barra',
                    'p.grupo as grupo_nome',
                    'p.nome as produto_nome',
                    's.nome_fantasia as fornecedor_nome',
                    's.cnpj_cpf as fornecedor_documento'
                )
                .leftJoin('product as p', 'p.id', 'ip.id_produto')
                .leftJoin('purchase as pu', 'pu.id', 'ip.id_compra')
                .leftJoin('supplier as s', 's.id', 'pu.id_fornecedor')
                .where('ip.id_compra', id);

            const purchase = await connection('purchase as pu')
                .select(
                    'pu.*',
                    'f.nome_fantasia as fornecedor_nome',
                    'f.cnpj_cpf as fornecedor_documento'
                )
                .leftJoin('supplier as f', 'f.id', 'pu.id_fornecedor')
                .where('pu.id', id)
                .first();

            const itemsWithTotal = (items || []).map(item => ({
                ...item,
                total_calculado: Number(item.unitario_bruto || 0) * Number(item.quantidade || 0)
            }));

            return {
                status: true,
                data: itemsWithTotal,
                purchase: purchase || {}
            };
        } catch (error) {
            return {
                status: false,
                msg: error.message,
                data: [],
                purchase: {}
            };
        }
    }

    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };

        try {
            const affectedRows = await connection(Purchase.table).where({ id }).update({
                id_fornecedor: data.id_fornecedor ?? null,
                total_bruto: Purchase.#toNumber(data.total_bruto),
                total_liquido: Purchase.#toNumber(data.total_liquido),
                desconto: Purchase.#toNumber(data.desconto),
                acrescimo: Purchase.#toNumber(data.acrescimo),
                observacao: data.observacao ?? null,
                updated_at: new Date()
            });

            return { status: affectedRows > 0 };
        } catch (error) {
            return { status: false, msg: error.message };
        }
    }
    static async deleteItem(data) {
    const id = data?.id ?? null;

    if (!id) {
        return { status: false, msg: 'ID do item é obrigatório!', id: 0 };
    }

    try {
        const item = await connection('item_purchase')
            .select('id_compra')
            .where({ id })
            .first();

        if (!item) {
            return { status: false, msg: 'Item não encontrado!', id: 0 };
        }

        const affectedRows = await connection('item_purchase')
            .where({ id })
            .del();

        if (!affectedRows) {
            return { status: false, msg: 'Não foi possível excluir o item.', id: 0 };
        }

        const totalPurchase = await connection('item_purchase')
            .where({ id_compra: item.id_compra })
            .sum({
                total_bruto: 'total_bruto',
                total_liquido: 'total_liquido'
            })
            .first();

        await connection('purchase')
            .where({ id: item.id_compra })
            .update({
                total_bruto: Number(totalPurchase?.total_bruto || 0),
                total_liquido: Number(totalPurchase?.total_liquido || 0),
                updated_at: new Date()
            });

        return {
            status: true,
            msg: 'Item excluído com sucesso!',
            id: Number(id)
        };
    } catch (error) {
        return {
            status: false,
            msg: error.message,
            id: 0
        };
    }
}

    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };

        try {
            const affectedRows = await connection(Purchase.table).where({ id }).del();
            return { status: affectedRows > 0 };
        } catch (error) {
            return { status: false, msg: error.message };
        }
    }
}
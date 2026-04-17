import connection from '../database/Connection.js';

export default class Purchase {
    static table = 'purchase';

    static async insert(data) {
        try {
            if (!data.id_fornecedor || !data.items || data.items.length === 0) {
                return { status: false, msg: 'Dados incompletos: Fornecedor ou Itens ausentes.' };
            }

            const transaction = await connection.transaction();

            try {
                const [inserted] = await transaction(Purchase.table).insert({
                    id_fornecedor: data.id_fornecedor,
                    estado_compra: data.estado_compra || 'RECEBIDO',
                    observacao: data.observacao || '',
                    total_bruto: data.total_bruto || 0,
                    total_liquido: data.total_liquido || 0,
                    desconto: data.desconto || 0,
                    acrescimo: data.acrescimo || 0,
                    created_at: new Date(),
                    updated_at: new Date()
                }).returning('id');

                const purchaseId = typeof inserted === 'object' ? inserted.id : inserted;

                const itensParaInserir = data.items.map(item => ({
                    id_compra: purchaseId,
                    id_produto: item.id_produto,
                    quantidade: item.quantidade,
                    unitario_bruto: item.unitario_bruto,
                    total_bruto: parseFloat((item.quantidade * item.unitario_bruto).toFixed(2)),
                    total_liquido: parseFloat((item.quantidade * item.unitario_bruto).toFixed(2)),
                    created_at: new Date(),
                    updated_at: new Date()
                }));

                await transaction('item_purchase').insert(itensParaInserir);
                await transaction.commit();

                return { status: true, msg: 'Compra registrada com sucesso!', id: purchaseId };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            console.error('Erro crítico no PurchaseController:', error);
            return { status: false, msg: 'Erro ao processar compra: ' + error.message };
        }
    }

    static async find(data = {}) {
        try {
            const records = await connection(`${Purchase.table} as p`)
                .select(
                    'p.*',
                    's.nome_fantasia as supplier_nome',
                    's.sobrenome_razao as supplier_razao'
                )
                .leftJoin('supplier as s', 'p.id_fornecedor', 's.id')
                .orderBy('p.created_at', 'desc');

            return { status: true, data: records };
        } catch (error) {
            console.error('Erro ao buscar compras:', error);
            return { status: false, data: [], msg: error.message };
        }
    }

    static async findById(id) {
        if (!id) return null;
        try {
            const purchase = await connection(Purchase.table).where({ id }).first();
            const items = await connection('purchase_item as pi')
                .select('pi.*', 'prod.nome as produto_nome')
                .leftJoin('product as prod', 'pi.id_produto', 'prod.id')
                .where('pi.id_compra', id);

            return { ...purchase, items };
        } catch (error) {
            console.error('Erro ao buscar detalhes da compra:', error);
            return null;
        }
    }

    static async delete(id) {
        if (!id) return { status: false, msg: 'ID necessário.' };
        try {
            await connection(Purchase.table).where({ id }).del();
            return { status: true, msg: 'Compra excluída com sucesso.' };
        } catch (error) {
            return { status: false, msg: 'Erro ao excluir: ' + error.message };
        }
    }
}
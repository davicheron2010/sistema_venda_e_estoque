import connection from '../database/Connection.js';

export default class Purchase {
    async insert(data) {
        try {
            if (!data.fornecedor_id || !data.itens || data.itens.length === 0) {
                return { status: false, msg: 'Dados de compra incompletos.' };
            }
            const transaction = await Database.transaction();

            try {
                const [purchase] = await transaction('compras').insert({
                    fornecedor_id: data.fornecedor_id,
                    estado_compra: data.estado_compra,
                    observacao: data.observacao,
                    total_geral: data.total_geral,
                    created_at: new Date(),
                    updated_at: new Date()
                }).returning('id');

                const purchaseId = purchase.id || purchase;

                const itensParaInserir = data.itens.map(item => ({
                    compra_id: purchaseId,
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    valor_unit: item.valor_unit,
                    desconto: item.desconto,
                    acrescimo: item.acrescimo,
                    total_liq: item.total_liq
                }));

                await transaction('compras_itens').insert(itensParaInserir);


                await transaction.commit();

                return { status: true, msg: 'Compra e itens registrados com sucesso!' };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            console.error('Erro no Controller Purchase (insert):', error);
            return { status: false, msg: 'Erro ao salvar no banco: ' + error.message };
        }
    }

    async find(where = {}) {
        try {
            const query = Database('compras as c')
                .select('c.*', 'f.nome_fantasia as fornecedor_nome')
                .leftJoin('fornecedores as f', 'c.fornecedor_id', 'f.id')
                .orderBy('c.created_at', 'desc');

            const records = await query;
            
            return {
                recordsTotal: records.length,
                data: records
            };
        } catch (error) {
            console.error('Erro no Controller Purchase (find):', error);
            return { recordsTotal: 0, data: [] };
        }
    }

    async findById(id) {
        try {
            const compra = await Database('compras').where({ id }).first();
            const itens = await Database('compras_itens').where({ compra_id: id });
            
            return { ...compra, itens };
        } catch (error) {
            console.error('Erro no Controller Purchase (findById):', error);
            return null;
        }
    }
}
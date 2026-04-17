import connection from '../database/Connection.js';

export default class Purchase {
    // Nome da tabela principal
    static table = 'purchase';

    /**
     * Insere uma nova compra e seus respectivos itens
     * @param {Object} data - Dados vindos do purchase.js (payload)
     */
    static async insert(data) {
        try {
            // Validação básica de segurança
            if (!data.id_fornecedor || !data.items || data.items.length === 0) {
                return { status: false, msg: 'Dados incompletos: Fornecedor ou Itens ausentes.' };
            }

            // Inicia a Transação
            const transaction = await connection.transaction();

            try {
                // 1. Inserir o cabeçalho da Compra na tabela 'purchase'
                const [inserted] = await transaction(Purchase.table).insert({
                    id_fornecedor: data.id_fornecedor,
                    observacao:   data.observacao || '',
                    total_bruto:   data.total_bruto || 0,
                    created_at:    new Date(),
                    updated_at:    new Date()
                }).returning('id');

                // Garante a captura do ID (ajuste para diferentes drivers de banco)
                const purchaseId = typeof inserted === 'object' ? inserted.id : inserted;

                // 2. Preparar os itens para inserção em massa (Batch Insert)
                const itensParaInserir = data.items.map(item => ({
                    id_compra:  purchaseId,      // FK para a compra que acabamos de criar
                    id_produto: item.id_produto, // FK vinda do dataset.productId do JS
                    quantidade:   item.quantidade,
                    unitario_bruto: item.unitario_bruto,
                    total_bruto:      parseFloat((item.quantidade * item.unitario_bruto).toFixed(2))
                }));

                // 3. Inserir os itens na tabela 'purchase_item'
                await transaction('item_purchase').insert(itensParaInserir);

                // Se chegou aqui sem erros, grava definitivamente no banco
                await transaction.commit();

                return { 
                    status: true, 
                    msg: 'Compra e itens registrados com sucesso!', 
                    id: purchaseId 
                };

            } catch (err) {
                // Se qualquer insert falhar, desfaz tudo o que foi feito nesta transação
                await transaction.rollback();
                throw err; 
            }

        } catch (error) {
            console.error('Erro crítico no PurchaseController:', error);
            return { 
                status: false, 
                msg: 'Erro ao processar compra no servidor: ' + error.message 
            };
        }
    }

    /**
     * Lista as compras realizadas (Geralmente para um DataTable de histórico)
     */
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

            return { 
                status: true,
                data: records 
            };
        } catch (error) {
            console.error('Erro ao buscar compras:', error);
            return { status: false, data: [], msg: error.message };
        }
    }

    /**
     * Busca detalhes de uma compra específica e seus itens
     */
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

    /**
     * Deleta uma compra (e por cascata ou manualmente os itens)
     */
    static async delete(id) {
        if (!id) return { status: false, msg: 'ID necessário.' };
        try {
            // Se o seu banco não tiver ON DELETE CASCADE, delete os itens antes:
            // await connection('purchase_item').where({ id_compra: id }).del();
            
            await connection(Purchase.table).where({ id }).del();
            return { status: true, msg: 'Compra excluída com sucesso.' };
        } catch (error) {
            return { status: false, msg: 'Erro ao excluir: ' + error.message };
        }
    }
}
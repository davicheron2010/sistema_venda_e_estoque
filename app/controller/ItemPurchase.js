import connection from '../database/Connection.js';

export default class ItemPurchase {
    static table = 'item_purchase';

    /**
     * Insere um item vinculado a uma compra
     * @param {Object} data - Objeto contendo id_compra, id_produto, quantidade, unitario_bruto, etc.
     */
    static async insert(data) {
        // Validação básica de chaves estrangeiras obrigatórias
        if (!data || !data.id_compra || !data.id_produto) {
            return { 
                status: false, 
                msg: 'id_compra e id_produto são obrigatórios para registrar o item', 
                id: null, 
                data: [] 
            };
        }

        try {
            const clean = ItemPurchase.#sanitize(data);
            
            const [result] = await connection(ItemPurchase.table)
                .insert(clean)
                .returning('*');

            return { 
                status: true, 
                msg: 'Item de compra registrado com sucesso!', 
                id: result.id, 
                data: [result] 
            };
        } catch (err) {
            console.error("Erro ao inserir ItemPurchase:", err);
            return { 
                status: false, 
                msg: 'Erro no banco de dados: ' + err.message, 
                id: null, 
                data: [] 
            };
        }
    }

    /**
     * Limpa os dados e garante tipagem correta antes da inserção
     */
    static #sanitize(data) {
        const ignore = ['id', 'action', 'created_at', 'updated_at'];
        const clean = {};

        for (const [key, value] of Object.entries(data)) {
            if (ignore.includes(key)) continue;
            if (value === '' || value === null || value === undefined) continue;

            // Tratamento de Booleanos
            if (value === 'true' || value === true) { clean[key] = true; continue; }
            if (value === 'false' || value === false) { clean[key] = false; continue; }

            // Tratamento de Números (Decimais da migration 18,4)
            // Se for string e parecer número, converte. Se já for número, mantém.
            if (typeof value === 'string' && /^-?[0-9]+(\.[0-9]+)?$/.test(value)) {
                clean[key] = Number(value);
                continue;
            }

            clean[key] = value;
        }

        return clean;
    }
}
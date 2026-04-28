import connection from '../database/Connection.js';
export default class Installment {
  // Tabela no banco
  static table = 'installment';
  //teste
  // Mapeamento: índice da coluna no DataTable → nome no banco
  static #columns = ['id', 'id_pagamento', 'parcela', 'intervalo'];
  //Insere um novo condição de pagamento.
  static async insert(data) {
    console.log(data);
    if (data.id_pagamento === null || data.parcela === null || data.intervalo === null) {
      return { status: false, msg: 'Preencha corretamento os dados para salvar', id: null, data: [] };
    }
    try {

      const clean = {
        id_pagamento: data.id_pagamento,
        parcela: data.parcela,
        intervalo: data.intervalo
      }

      //Inserir no banco de dados 
      const [result] = await connection(Installment.table)
        .insert(clean)
        .returning('*');

      const response = { status: true, msg: 'Salvo com sucesso!', id: result.id, data: result };

      return response;
    } catch (error) {
      return { status: false, msg: 'Erro: ' + error.message, id: null, data: [] };
    }
  }
  //Implementamos a pesquisa completa para o cliente
  static async find(data = {}) {

  }

  static async findByPaymentTerms(id_pagamento) {
    const dataQ = connection(Installment.table).select('id', 'parcela', 'intervalo');
    dataQ.where({ id_pagamento: id_pagamento });
    const rows = await dataQ;
    return { status: true, msg: 'Parcelas encontradas!', data: rows };
  }

  //listar as parcelas da condição de pagamento
  static async findById(id) {
    try {
      const result = await connection(Installment.table)
        .where({ id: id })
        .select('*');

      return { status: true, msg: 'Parcelas encontradas!', id: null, data: result };
    } catch (error) {
      return { status: false, msg: 'Erro: ' + error.message, id: null, data: [] };
    }
  }

  //Deleta uma parcela pelo ID
  static async delete(id) {
    try {
      const affectedRows = await connection(Installment.table)
        .where({ id: id })
        .del();

      return { status: affectedRows > 0, msg: affectedRows > 0 ? 'Parcela deletada com sucesso!' : 'Parcela não encontrada' };
    } catch (error) {
      return { status: false, msg: 'Erro: ' + error.message };
    }
  }

  //Atualiza uma parcela pelo ID
  static async update(id, data) {
    try {
      const clean = Installment.#sanitize(data);
      const affectedRows = await connection(Installment.table)
        .where({ id: id })
        .update(clean);

      return { status: affectedRows > 0, msg: affectedRows > 0 ? 'Parcela atualizada com sucesso!' : 'Parcela não encontrada' };
    } catch (error) {
      return { status: false, msg: 'Erro: ' + error.message };
    }
  }

  //Remove campos vazios e converte tipos.
  static #sanitize(data) {
    // Campos de controle do form — não existem no banco
    const ignore = ['id', 'acao'];

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

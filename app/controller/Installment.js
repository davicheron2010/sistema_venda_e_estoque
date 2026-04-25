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
    if (data.id === null || data.parcela === null || data.intervalo === null) {
      return { status: false, msg: 'Preencha corretamento os dados para salvar', id: null, data: [] };
    }
    try {

      const clean = {
        id_pagamento: data.id,
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

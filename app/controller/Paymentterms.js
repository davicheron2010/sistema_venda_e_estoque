import connection from '../database/Connection.js';
export default class PaymentTerms {
  // Tabela no banco
  static table = 'customer';
  //teste
  // Mapeamento: índice da coluna no DataTable → nome no banco
  static #columns = ['id', 'codigo', 'titulo'];

  //Insere um novo condição de pagamento.
  static async insert(data) {
    if (data.codigo === null || data.titulo === null) {
      return { status: false, msg: 'Preencha corretamento os dados para salvar', id: null, data: [] };
    }

    const clean = PaymentTerms.#sanitize(data);

    //Inserir no banco de dados 
    const [result] = await connection('payment_terms')
      .insert(clean)
      .returning('*');

    return { status: true, msg: 'Salvo com sucesso!', id: result.id, data: [result] };
  }

  //Remove campos vazios e converte tipos.
  static #sanitize(data) {
    // Campos de controle do form — não existem no banco
    const ignore = ['id', 'action'];

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

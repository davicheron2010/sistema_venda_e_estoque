const URL_UFS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';

exports.seed = async function (knex) {

  const response = await fetch(URL_UFS);
  if (!response.ok) {
    throw new Error(`Restrição: ${response.statusText}`);
  }
  const UFS = await response.json();
  await knex('federative_unit').del();
  
  const país = await knex('country')
    .select('id')
    .where('codigo', 'BR')
    .first();

  const dados = UFS.map((UF) => ({
    id_country: país.id,
    codigo: UF?.id,
    sigla: UF?.sigla,
    nome: UF?.nome,

  }));
  await knex('federative_unit').insert(dados);
  console.log(`Todos os estados brasileiros foram importados com sucesso: ${dados.lenght}`)
};
// Usa o fetch nativo do Node.js 18+ — sem necessidade de instalar node-fetch
const URL_PAISES = 'https://servicodados.ibge.gov.br/api/v1/paises';
exports.seed = async function (knex) {
  // 1. BUSCA OS DADOS DO JSON VIA FETCH NATIVO DO NODE.JS
  const resposta = await fetch(URL_PAISES);

  if (!resposta.ok) {
    throw new Error(`Falha ao buscar os dados dos países: ${resposta.statusText}`);
  }

  const paises = await resposta.json();

  // 2. LIMPA A TABELA ANTES DE INSERIR OS DADOS
  await knex('country').del();

  // 3. MAPEIA O JSON PARA O FORMATO DA TABELA country
  const dados = paises.map((pais) => {

    const codigo = pais?.id?.['ISO-3166-1-ALPHA-2'] ?? null;
    const nome = pais?.nome?.abreviado ?? null;
    const regiao = pais?.localizacao?.regiao?.nome ?? null;
    const subRegiao = pais?.localizacao?.['sub-regiao']?.nome ?? null;
    const localizacao = [regiao, subRegiao].filter(Boolean).join(' - ') || null;

    const lingua = pais?.linguas?.length
      ? pais.linguas.map((l) => l.nome).join(', ')
      : null;

    const moeda = pais?.['unidades-monetarias']?.length
      ? pais['unidades-monetarias'].map((m) => m.nome).join(', ')
      : null;

    return { codigo, nome, localizacao, lingua, moeda };

  });

  // 4. INSERE EM LOTES DE 100 PARA MELHOR PERFORMANCE
  const batchSize = 100;

  for (let i = 0; i < dados.length; i += batchSize) {
    const lote = dados.slice(i, i + batchSize);
    await knex('country').insert(lote);
    console.log(`Inseridos ${Math.min(i + batchSize, dados.length)} de ${dados.length} países`);
  }

  console.log('Seed de países concluída com sucesso!');
};
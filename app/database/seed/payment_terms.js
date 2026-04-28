exports.seed = async function (knex) {
  await knex('installment').del();
  await knex('payment_terms').del();

  async function inserirCondicao(codigo, titulo, atalho, parcelas) {
    const inserted = await knex('payment_terms')
      .insert({
        codigo,
        titulo,
        atalho,
        data_cadastro: new Date(),
        data_atualizacao: new Date(),
      })
      .returning('id');

    const paymentId = Array.isArray(inserted)
      ? (inserted[0]?.id ?? inserted[0] ?? null)
      : (inserted?.id ?? inserted ?? null);

    if (!paymentId) {
      throw new Error(`Não foi possível obter o ID da condição ${codigo}`);
    }

    const itens = parcelas.map(({ parcela, intervalo }) => ({
      id_pagamento: Number(paymentId),
      parcela,
      intervalo,
      alterar_vencimento_conta: 0,
      data_cadastro: new Date(),
      data_atualizacao: new Date(),
    }));

    await knex('installment').insert(itens);
  }

  await inserirCondicao('pix', 'Pix', 'PIX', [
    { parcela: 1, intervalo: 0 },
  ]);

  await inserirCondicao('cartao', 'Cartão', 'CC', [
    { parcela: 1, intervalo: 30 },
    { parcela: 2, intervalo: 60 },
    { parcela: 3, intervalo: 90 },
    { parcela: 4, intervalo: 120 },
    { parcela: 5, intervalo: 150 },
    { parcela: 6, intervalo: 180 },
    { parcela: 7, intervalo: 210 },
    { parcela: 8, intervalo: 240 },
    { parcela: 9, intervalo: 270 },
    { parcela: 10, intervalo: 300 },
    { parcela: 11, intervalo: 330 },
    { parcela: 12, intervalo: 360 },
  ]);

  await inserirCondicao('dinheiro', 'Dinheiro', 'DIN', [
    { parcela: 1, intervalo: 0 },
  ]);

  console.log('✅ Seed de payment_terms e installment inserida com sucesso!');
};
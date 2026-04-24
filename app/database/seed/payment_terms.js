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

    const itens = parcelas.map(({ parcela, intervalor }) => ({
      id_pagamento: Number(paymentId),
      parcela,
      intervalor,
      alterar_vencimento_conta: 0,
      data_cadastro: new Date(),
      data_atualizacao: new Date(),
    }));

    await knex('installment').insert(itens);
  }

  await inserirCondicao('pix', 'Pix', 'PIX', [
    { parcela: 1, intervalor: 0 },
  ]);

  await inserirCondicao('cartao', 'Cartão', 'CC', [
    { parcela: 1, intervalor: 30 },
    { parcela: 2, intervalor: 60 },
    { parcela: 3, intervalor: 90 },
    { parcela: 4, intervalor: 120 },
    { parcela: 5, intervalor: 150 },
    { parcela: 6, intervalor: 180 },
    { parcela: 7, intervalor: 210 },
    { parcela: 8, intervalor: 240 },
    { parcela: 9, intervalor: 270 },
    { parcela: 10, intervalor: 300 },
    { parcela: 11, intervalor: 330 },
    { parcela: 12, intervalor: 360 },
  ]);

  await inserirCondicao('dinheiro', 'Dinheiro', 'DIN', [
    { parcela: 1, intervalor: 0 },
  ]);

  console.log('✅ Seed de payment_terms e installment inserida com sucesso!');
};
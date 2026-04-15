exports.up = async function (knex) {
  await knex.schema.createTable('installment', (table) => {
    table.bigIncrements('id').notNullable().primary();
    table.bigInteger('id_pagamento').nullable();
    table.integer('parcela').nullable();
    table.integer('intervalor').nullable();
    table.integer('alterar_vencimento_conta').nullable();
    table.datetime('data_cadastro').nullable().defaultTo(knex.fn.now());
    table.datetime('data_atualizacao').nullable().defaultTo(knex.fn.now());

    table
      .foreign('id_pagamento')
      .references('id')
      .inTable('payment_terms')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('installment');
};
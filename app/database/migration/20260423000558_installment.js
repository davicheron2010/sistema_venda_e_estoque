/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('installment', (table) => {
    table.bigIncrements('id').primary();
    
    table.bigInteger('id_pagamento').unsigned().nullable();
    table.integer('parcela').nullable();
    table.integer('intervalor').nullable(); // Mantido o nome original do PHP
    table.integer('alterar_vencimento_conta').nullable();
    
    table.timestamp('data_cadastro').defaultTo(knex.fn.now());
    table.timestamp('data_atualizacao').defaultTo(knex.fn.now());

    // Chave Estrangeira
    table.foreign('id_pagamento')
      .references('id')
      .inTable('payment_terms')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('installment');
};

exports.up = function (knex) {
  return knex.schema.createTable('payment_terms', (table) => {
    table.bigIncrements('id').primary();
    table.text('codigo').nullable();
    table.text('titulo').nullable();
    table.text('atalho').nullable();
    table.datetime('data_cadastro').nullable().defaultTo(knex.fn.now());
    table.datetime('data_atualizacao').nullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('payment_terms');
};
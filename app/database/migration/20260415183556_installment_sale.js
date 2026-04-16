exports.up = async function (knex) {
  await knex.schema.createTable('installment_sale_purchase', (table) => {
    table.bigIncrements('id').notNullable().primary();
    table.bigInteger('id_sale').notNullable();
    table.bigInteger('id_purchase').notNullable();
    table.bigInteger('id_installment').notNullable();
    table.bigInteger('id_payment_terms').notNullable();
    table.integer('total_parcelas').notNullable();
    table.decimal('valor_total', 12, 2).notNullable();
    table.decimal('valor_pago_total', 12, 2).nullable().defaultTo(0);
    table
      .enu('status', ['aberto', 'pago', 'parcial', 'cancelado'])
      .notNullable()
      .defaultTo('aberto');
    table.datetime('data_cadastro').nullable().defaultTo(knex.fn.now());
    table.datetime('data_atualizacao').nullable().defaultTo(knex.fn.now());

    table
      .foreign('id_sale')
      .references('id')
      .inTable('sale')
      .onDelete('CASCADE');
    table
      .foreign('id_purchase')
      .references('id')
      .inTable('purchase')
      .onDelete('CASCADE');
    table
      .foreign('id_installment')
      .references('id')
      .inTable('installment')
      .onDelete('CASCADE');

    table
      .foreign('id_payment_terms')
      .references('id')
      .inTable('payment_terms')
      .onDelete('RESTRICT');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('installment_sale_purchase');
};
exports.up = async function (knex) {
  await knex.schema.createTable('purchase', (table) => {
    table.bigIncrements('id').notNullable().primary();
    table.bigInteger('id_fornecedor').nullable();
    table.decimal('total_bruto', 18, 4).nullable();
    table.decimal('total_liquido', 18, 4).nullable();
    table.decimal('desconto', 18, 4).nullable();
    table.decimal('acrescimo', 18, 4).nullable();
    table.text('observacao').nullable();

    table.timestamp('data_cadastro').defaultTo(knex.fn.now());
    table.timestamp('data_atualizacao').defaultTo(knex.fn.now());

    table
      .foreign('id_fornecedor')
      .references('id')
      .inTable('supplier')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');
  });

  await knex.raw(
    'ALTER TABLE purchase ADD COLUMN estado_compra stock_movement_compra'
  );
};
exports.up = async function (knex) {
  await knex.schema.createTable('stock_movement', (table) => {
    table.bigIncrements('id').notNullable().primary();
    table.bigInteger('id_item_compra').nullable();
    table.bigInteger('id_item_venda').nullable();
    table.bigInteger('id_produto').nullable();
    table.decimal('quantidade_entrada', 18, 4).nullable();
    table.decimal('quantidade_saida', 18, 4).nullable();
    table.text('observacao').nullable();
    table.datetime('data_cadastro').nullable().defaulclstTo(knex.fn.now());
    table.datetime('data_atualizacao').nullable().defaultTo(knex.fn.now());

    table
      .foreign('id_item_compra')
      .references('id')
      .inTable('item_purchase')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');

    table
      .foreign('id_item_venda')
      .references('id')
      .inTable('item_sale')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');

    table
      .foreign('id_produto')
      .references('id')
      .inTable('product')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');
  });

  await knex.raw('ALTER TABLE stock_movement ADD COLUMN tipo stock_movement_direction');
  await knex.raw('ALTER TABLE stock_movement ADD COLUMN origem_movimento stock_movement_origin');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('stock_movement');
};
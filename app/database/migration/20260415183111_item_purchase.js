exports.up = async function (knex) {
  await knex.schema.createTable('item_purchase', (table) => {
    table.bigIncrements('id').notNullable().primary();
    table.bigInteger('id_compra').nullable();
    table.bigInteger('id_produto').nullable();
    table.decimal('quantidade', 18, 4).nullable();
    table.decimal('total_bruto', 18, 4).nullable();
    table.decimal('unitario_bruto', 18, 4);
    table.decimal('total_liquido', 18, 4).nullable().comment('Valor a ser pago produto.');
    table.decimal('unitario_liquido', 18, 4);
    table.decimal('desconto', 18, 4).nullable();
    table.decimal('acrescimo', 18, 4).nullable();
    table.text('nome').nullable();
    table.timestamps(true, true);

    table
      .foreign('id_compra')
      .references('id')
      .inTable('purchase')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');

    table
      .foreign('id_produto')
      .references('id')
      .inTable('product')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('item_purchase');
};
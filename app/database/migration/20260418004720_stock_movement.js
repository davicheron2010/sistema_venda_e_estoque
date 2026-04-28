export function up(knex) {
    return knex.schema
        .createTable('stock_movement', (table) => {
            table.bigIncrements('id').primary();
            table.bigInteger('id_item_compra').nullable();
            table.bigInteger('id_item_venda').nullable();
            table.bigInteger('id_produto').nullable();
            table.decimal('quantidade_entrada', 18, 4).nullable();
            table.decimal('quantidade_saida', 18, 4).nullable();
            table.text('observacao').nullable();
            table.timestamp('data_cadastro').nullable().defaultTo(knex.fn.now());
            table.timestamp('data_atualizacao').nullable().defaultTo(knex.fn.now());

            table.foreign('id_item_compra').references('id').inTable('item_purchase').onDelete('CASCADE').onUpdate('NO ACTION');
            table.foreign('id_item_venda').references('id').inTable('item_sale').onDelete('CASCADE').onUpdate('NO ACTION');
            table.foreign('id_produto').references('id').inTable('product').onDelete('CASCADE').onUpdate('NO ACTION');
        })
        .then(() => knex.raw(`
            ALTER TABLE stock_movement ADD COLUMN tipo stock_movement_direction;
            ALTER TABLE stock_movement ADD COLUMN origem_movimento stock_movement_origin;
        `));
}

export function down(knex) {
    return knex.schema.dropTable('stock_movement');
}
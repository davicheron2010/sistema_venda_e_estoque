export function up(knex) {
    return knex.schema.createTable('item_purchase', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('id_compra').nullable();
        table.bigInteger('id_produto').nullable();
        table.decimal('quantidade', 18, 4).nullable();
        table.decimal('total_bruto', 18, 4).nullable();
        table.decimal('total_liquido', 18, 4).nullable().comment('Valor a ser pago produto.');
        table.decimal('preco_unitario', 18, 4).nullable();
        table.decimal('desconto', 18, 4).nullable();
        table.decimal('acrescimo', 18, 4).nullable();
        table.text('nome').nullable();
        table.timestamp('data_cadastro').nullable().defaultTo(knex.fn.now());
        table.timestamp('data_atualizacao').nullable().defaultTo(knex.fn.now());

        table.foreign('id_compra').references('id').inTable('purchase').onDelete('CASCADE').onUpdate('NO ACTION');
        table.foreign('id_produto').references('id').inTable('product').onDelete('CASCADE').onUpdate('NO ACTION');
    });
}

export function down(knex) {
    return knex.schema.dropTable('item_purchase');
}
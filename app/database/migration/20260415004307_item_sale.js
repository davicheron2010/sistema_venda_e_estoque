exports.up = function (knex) {
    return knex.schema.createTable('item_sale', (table) => {
        table.comment('Tabela de itens vendidos');
        table.bigIncrements('id').primary();
        table.bigInteger('id_venda');
        table.bigInteger('id_produto');
        table.text('descricao');
        table.numeric('quantidade', 18, 4);
        table.numeric('total_bruto', 18, 4);
        table.numeric('total_liquido', 18, 4);
        table.numeric('desconto', 18, 4);
        table.numeric('acrescimo', 18, 4);
        table.text('nome');
        table.timestamps(true, true);
        table
            .foreign('id_venda')
            .references('id')
            .inTable('sale')
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

exports.down = function (knex) {
    return knex.schema.dropTable('item_sale');
};
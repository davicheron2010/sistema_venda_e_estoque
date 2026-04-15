exports.up = function (knex) {
    return knex.schema.createTable('sale', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('id_cliente');
        table.numeric('total_bruto', 18, 4);
        table.numeric('total_liquido', 18, 4);
        table.numeric('desconto', 18, 4);
        table.numeric('acrescimo', 18, 4);
        table.text('observacao');
        table.timestamps(true, true);
        table
            .foreign('id_cliente')
            .references('id')
            .inTable('customer')
            .onDelete('CASCADE')
            .onUpdate('NO ACTION');
        
        return knex.schema.raw('ALTER TABLE sale ADD COLUMN estado_venda stock_movement_venda;');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('sale');
};
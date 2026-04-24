exports.up = function (knex) {
    return knex.schema.createTable('contact', (table) => {
        table.bigIncrements('id').primary();
        table.text('tipo_contato').notNullable();
        table.text('contato').notNullable();
        table.bigInteger('id_cliente').notNullable();
        table.bigInteger('id_fornecedor').notNullable();
        table.bigInteger('entity_id').notNullable();
        table.timestamps(true, true);


        table.foreign('id_cliente').references('id').inTable('customer');
        table.foreign('id_fornecedor').references('id').inTable('supplier');
        
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('contact');
};
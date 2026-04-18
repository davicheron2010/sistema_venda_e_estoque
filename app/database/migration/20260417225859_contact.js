exports.up = function (knex) {
    return knex.schema.createTable('contact', (table) => {
        table.bigIncrements('id').primary();
        table.text('tipo_contato').notNullable();
        table.text('contato').notNullable();
        table.bigInteger('id_cliente').notNullable();
        table.bigInteger('id_fornecedor').notNullable();
        table.bigInteger('id_empresa').notNullable();
        table.bigInteger('entity_id').notNullable();
        table.timestamps(true, true);


        table.foreign('id_cliente').references('id').inTable('customer');
        table.foreign('id_fornecedor').references('id').inTable('supplier');
        table.foreign('id_empresa').references('id').inTable('company');
        
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('contact');
};
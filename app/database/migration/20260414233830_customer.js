export function up(knex) {
    return knex.schema.createTable('customer', (table) => {
        table.bigIncrements('id').primary();
        table.string('nome', 255).notNullable();
        table.string('cpf', 11).unique().index();
        table.string('rg', 20);
        table.boolean('ativo').defaultTo(true);
        table.timestamps(true, true);
    });
}

export function down(knex) {
    return knex.schema.dropTable('customer');
}
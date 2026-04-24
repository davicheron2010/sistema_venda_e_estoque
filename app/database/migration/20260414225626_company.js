export function up(knex) {
    return knex.schema.createTable('company', (table) => {
        table.bigIncrements('id').primary();
        table.text('nome').notNullable();
        table.text('cnpj');
        table.text('email');
        table.text('telefone');
        table.boolean('ativo').defaultTo(true);
        table.boolean('excluido').defaultTo(false);
        table.timestamps(true, true);
    });
};

export function down(knex) {
    return knex.schema.dropTable('company');
};
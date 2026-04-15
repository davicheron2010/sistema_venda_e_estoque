export function up(knex) {
    return knex.schema.createTable('contact', (table) => {
        table.bigIncrements('id').primary();
        table.text('email').notNullable();
        table.text('telefone').notNullable();
        table.text('whatsapp');
        table.boolean('ativo').defaultTo(true);
        table.boolean('excluido').defaultTo(false);
        table.timestamps(true, true);
    });
}

export function down(knex) {
    return knex.schema.dropTable('contact');
}
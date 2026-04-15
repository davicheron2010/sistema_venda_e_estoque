export function up(knex) {
    return knex.schema.createTable('supplier', (table) => {
        table.bigIncrements('id').primary();
        table.text('nome_fantasia').notNullable();
        table.text('razao_social').notNullable();
        table.text('cnpj_cpf');
        table.text('ie_rg');
        table.boolean('ativo').defaultTo(true);
        table.boolean('excluido').defaultTo(false);
        table.timestamps(true, true);
    });
}

export function down(knex) {
    return knex.schema.dropTable('supplier');
}
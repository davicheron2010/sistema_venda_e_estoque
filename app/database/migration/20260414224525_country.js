export function up(knex) {
    return knex.schema.createTable('country', (table) => {
        table.bigIncrements('id').primary();
        table.text('codigo').nullable();      // ISO-3166-1-ALPHA-2: BR, US, PT...
        table.text('nome').nullable();        // Nome abreviado do país
        table.text('localizacao').nullable(); // Região - Sub-região: ex: "Américas - América do Sul"
        table.text('lingua').nullable();      // Línguas: ex: "Português, Espanhol"
        table.text('moeda').nullable();       // Moedas: ex: "Real Brasileiro"
        table.timestamp('criado_em', { useTz: false }).defaultTo(knex.fn.now());
        table.timestamp('atualizado_em', { useTz: false }).defaultTo(knex.fn.now());
    });
}

export function down(knex) {
    return knex.schema.dropTable('country');
}
export function up(knex) {
    return knex.schema.createTable('federative_unit', (table) => {
        table.bigIncrements('id').primary();
        table.text('nome').notNullable();           // Minas Gerais, São Paulo...
        table.text('codigo').notNullable();    // 31, 35, 33...
        table.text('sigla').notNullable();          // MG, SP, RJ... 
        table.bigInteger('id_country').unsigned();
        table.boolean('ativo').defaultTo(true);
        table.timestamp('criado_em', { useTz: false }).defaultTo(knex.fn.now());
        table.timestamp('atualizado_em', { useTz: false }).defaultTo(knex.fn.now());

        table.foreign('id_country')
            .references('id')
            .inTable('country')
            .onDelete('CASCADE')
            .onUpdate('NO ACTION');
    });
}

export function down(knex) {
    return knex.schema.dropTable('federative_unit');
}
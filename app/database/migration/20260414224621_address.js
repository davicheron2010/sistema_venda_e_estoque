export function up(knex) {
    return knex.schema.createTable('address', (table) => {
        table.bigIncrements('id').primary();
        table.text('logradouro').notNullable();       // Rua, Av, Travessa...
        table.text('numero').notNullable();           // 123, S/N...
        table.text('complemento');                    // Apto, Bloco, Sala...
        table.text('bairro').notNullable();
        table.text('cep').notNullable();
        table.text('referencia');                     // perto do mercado X...
        table.bigInteger('id_city').unsigned();
        table.boolean('ativo').defaultTo(true);
        table.timestamp('criado_em', { useTz: false }).defaultTo(knex.fn.now());
        table.timestamp('atualizado_em', { useTz: false }).defaultTo(knex.fn.now());

        table.foreign('id_city')
            .references('id')
            .inTable('country')
            .onDelete('CASCADE')
            .onUpdate('NO ACTION');

    });
}

export function down(knex) {
    return knex.schema.dropTable('address');
}
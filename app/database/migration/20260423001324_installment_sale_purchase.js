/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('installment_sale_purchase', (table) => {
        // 'id' como bigInteger, auto-incremento e chave primária
        table.bigIncrements('id').primary();

        table.bigInteger('id_sale').unsigned().notNullable();
        table.bigInteger('id_installment').unsigned().notNullable();
        table.bigInteger('id_payment_terms').unsigned().notNullable();
        table.integer('total_parcelas').notNullable();
        table.integer('numero_parcela').notNullable();
        table.decimal('valor_parcela', 18, 4).notNullable();
        table.decimal('valor_total', 18, 4).notNullable();
        // Enum para o status
        table.enum('status', ['aberto', 'pago', 'cancelado'])
            .defaultTo('aberto')
            .notNullable();

        table.date('data_vencimento').defaultTo(knex.fn.now());

        // Timestamps com valor padrão CURRENT_TIMESTAMP
        table.timestamp('data_cadastro').defaultTo(knex.fn.now());
        table.timestamp('data_atualizacao').defaultTo(knex.fn.now());

        // Chaves Estrangeiras
        table.foreign('id_sale').references('id').inTable('sale').onDelete('CASCADE');
        table.foreign('id_installment').references('id').inTable('installment').onDelete('CASCADE');
        table.foreign('id_payment_terms').references('id').inTable('payment_terms').onDelete('RESTRICT');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('installment_sale_purchase');
};

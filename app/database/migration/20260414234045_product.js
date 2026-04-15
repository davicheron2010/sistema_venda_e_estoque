export function up(knex) {
    return knex.schema.createTable('product', (table) => {
            table.bigIncrements('id').primary();
            table.text('nome').notNullable();
            table.text('codigo_barra');
            table.text('unidade');
            table.decimal('preco_compra', 18, 4).defaultTo(0);
            table.decimal('total_imposto', 18, 4).defaultTo(0);
            table.decimal('margem_lucro', 18, 4).defaultTo(0);
            table.decimal('custo_operacional', 18, 4).defaultTo(0);
            table.decimal('valor_venda_sugerido', 18, 4).defaultTo(0);
            table.decimal('preco_venda', 18, 4).defaultTo(0);
            table.text('descricao');
            table.boolean('ativo').defaultTo(true);
            table.boolean('excluido').defaultTo(false);
            table.timestamps(true, true);
        });
}
//teste
export function down(knex) {
    return knex.schema.dropTable('product');
}
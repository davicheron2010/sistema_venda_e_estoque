export function up(knex) {
    return knex.raw(`
        DROP VIEW IF EXISTS view_product;
        CREATE OR REPLACE VIEW view_product AS
        SELECT 
            p.id::TEXT,
            p.nome,
            p.codigo_barra,
            p.grupo,
            p.descricao,
            p.preco_venda AS valor,
            p.ativo,
            TRUE AS produto
        FROM public.product p
        WHERE p.excluido = FALSE;
    `);
}

export function down(knex) {
    return knex.raw(`DROP VIEW IF EXISTS view_product;`);
}
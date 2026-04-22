export function up(knex) {
    return knex.raw(`
        CREATE TRIGGER trg_refresh_estoque_on_movement
        AFTER INSERT OR UPDATE OR DELETE ON stock_movement
        FOR EACH STATEMENT
        EXECUTE FUNCTION refresh_mvw_estoque();

        CREATE TRIGGER trg_refresh_estoque_on_product
        AFTER UPDATE OF excluido, nome OR DELETE ON product
        FOR EACH STATEMENT
        EXECUTE FUNCTION refresh_mvw_estoque();

        CREATE TRIGGER trg_purchase_to_stock_movement
        AFTER INSERT OR UPDATE OF estado_compra ON purchase
        FOR EACH ROW
        EXECUTE FUNCTION fn_trigger_purchase_to_stock_movement();

        CREATE TRIGGER trg_init_product_stock
        AFTER INSERT ON product
        FOR EACH ROW
        EXECUTE FUNCTION fn_trigger_inicializar_estoque();
    `);
}

export function down(knex) {
    return knex.raw(`
        DROP TRIGGER IF EXISTS trg_refresh_estoque_on_movement ON stock_movement;
        DROP TRIGGER IF EXISTS trg_refresh_estoque_on_product ON product;
        DROP TRIGGER IF EXISTS trg_purchase_to_stock_movement ON purchase;
        DROP TRIGGER IF EXISTS trg_init_product_stock ON product;
    `);
}
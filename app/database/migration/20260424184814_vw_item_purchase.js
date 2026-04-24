/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.raw(`
    CREATE OR REPLACE VIEW vw_item_purchase AS 
    SELECT 
      item_purchase.id_compra, 
      COALESCE(SUM(total_liquido), 0) AS total_liquido, 
      COALESCE(SUM(total_bruto), 0) AS total_bruto 
    FROM item_purchase 
    GROUP BY item_purchase.id_compra;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw(`
    DROP VIEW IF EXISTS vw_item_purchase;
  `);
};
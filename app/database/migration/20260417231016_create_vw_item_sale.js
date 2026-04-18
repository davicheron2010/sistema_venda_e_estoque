/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.raw(`
    CREATE OR REPLACE VIEW vw_item_sale AS 
    SELECT 
      item_sale.id_venda, 
      COALESCE(SUM(total_liquido), 0) AS total_liquido, 
      COALESCE(SUM(total_bruto), 0) AS total_bruto 
    FROM item_sale 
    GROUP BY item_sale.id_venda;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw(`
    DROP VIEW IF EXISTS vw_item_sale;
  `);
};

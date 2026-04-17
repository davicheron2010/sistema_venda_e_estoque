exports.up = async function (knex) {
  await knex.raw(`
    CREATE TYPE stock_movement_direction AS ENUM ('ENTRADA', 'SAIDA');

    CREATE TYPE stock_movement_origin AS ENUM (
      'VENDA',
      'CANCELAMENTO_VENDA',
      'COMPRA',
      'CANCELAMENTO_COMPRA',
      'AJUSTE_MANUAL',
      'INVENTARIO',
      'TRANSFERENCIA'
    );

    CREATE TYPE stock_movement_venda AS ENUM (
      'PRE_VENDA',
      'ORCAMENTO',
      'VENDA'
    );

    CREATE TYPE stock_movement_compra AS ENUM (
      'EM_ANDAMENTO',
      'CONCLUIDO',
      'RECEBIDO'
    );
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    DROP TYPE IF EXISTS stock_movement_direction;
    DROP TYPE IF EXISTS stock_movement_origin;
    DROP TYPE IF EXISTS stock_movement_venda;
    DROP TYPE IF EXISTS stock_movement_compra;
  `);
};
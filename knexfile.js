import 'dotenv/config';

const shared = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './app/database/migration',
  },
  seeds: {
    directory: './app/database/seed',
  },
};

export default {
  development: { ...shared },
  production: { ...shared, pool: { min: 2, max: 20 } },
};
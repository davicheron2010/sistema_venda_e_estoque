// Carrega as variáveis de ambiente do arquivo .env para o process.env
import "dotenv/config";
// Objeto compartilhado com as configurações base do banco de dados
// Será reutilizado nos ambientes de desenvolvimento e produção
const shared = {
  // Define o tipo de banco de dados (driver); 'pg' = PostgreSQL
  client: "pg",
  // Configurações de conexão com o banco de dados
  connection: {
    // Host do banco de dados (ex: 'localhost' ou IP do servidor)
    host: process.env.DB_HOST,
    // Porta de conexão; usa o valor do .env ou 5432 como padrão do PostgreSQL
    port: Number(process.env.DB_PORT) || 5432,
    // Usuário do banco de dados definido no .env
    user: process.env.DB_USER,
    // Senha do banco de dados definida no .env
    password: process.env.DB_PASSWORD,
    // Nome do banco de dados definido no .env
    database: process.env.DB_NAME,
  },
  // Configurações do sistema de migrations (controle de versão do banco)
  migrations: {
    // Nome da tabela que o Knex usa internamente para registrar as migrations executadas
    tableName: "knex_migrations",
    // Diretório onde os arquivos de migration estão localizados
    directory: "./app/database/migration",
  },
  // Configurações dos seeds (dados iniciais/de teste para o banco)
  seeds: {
    // Diretório onde os arquivos de seed estão localizados
    directory: "./app/database/seed",
  },
};
// Exporta as configurações separadas por ambiente
export default {
  // Ambiente de desenvolvimento: usa as configurações base sem alterações
  development: { ...shared },
  // Ambiente de produção: usa as configurações base e adiciona um pool de conexões
  // min: 2 conexões sempre abertas | max: 20 conexões simultâneas no máximo
  production: { ...shared, pool: { min: 2, max: 20 } },
};

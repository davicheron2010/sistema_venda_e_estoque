import knex from 'knex';
//  Ambiente e constantes
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
//  Configuração da conexão PostgreSQL
const connection = knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        // SSL forçado em produção — rejeita conexões não criptografadas
        ssl: IS_PROD ? { rejectUnauthorized: true } : false,
    },
    //Pool de conexões
    pool: {
        // Conexões pré-aquecidas prontas para uso imediato
        min: Number(process.env.DB_POOL_MIN) || 2,
        // Limite de conexões simultâneas (ajuste conforme carga)
        max: Number(process.env.DB_POOL_MAX) || 10,
        // Conexão ociosa por mais de 30s é devolvida e destruída
        idleTimeoutMillis: 30_000,
        // A cada 5s o pool varre e elimina conexões ociosas excedentes
        reapIntervalMillis: 5_000,
        // Se não conseguir conexão em 5s, lança erro em vez de travar
        acquireTimeoutMillis: 5_000,
        // Não propaga erro de criação para evitar crash em picos
        propagateCreateError: false,
        // Executado em cada nova conexão criada pelo pool
        afterCreate(conn, done) {
            const setup = [
                `SET timezone = 'UTC'`,
                `SET search_path TO ${DB_SCHEMA}`,
                `SET statement_timeout = '30s'`,
            ].join('; ');
            conn.query(setup, (err) => {
                if (err) {
                    console.error('[DB] Falha no setup da conexão:', err.message);
                }
                done(err, conn);
            });
        },
    },
    //Performance
    searchPath: [DB_SCHEMA],
    wrapIdentifier: (value, origImpl) => origImpl(value),
    //Logging
    log: {
        warn(msg) { console.warn('[DB WARN]', msg); },
        error(msg) { console.error('[DB ERROR]', msg); },
        debug(msg) {
            if (!IS_PROD) console.log('[DB DEBUG]', msg);
        },
    },
    // Debug de queries apenas em development
    debug: !IS_PROD,
});

//  Shutdown graceful — libera pool ao encerrar
const gracefulShutdown = () => {
    console.log('[DB] Encerrando pool de conexões...');
    connection.destroy()
        .then(() => {
            console.log('[DB] Pool encerrado com sucesso');
            process.exit(0);
        })
        .catch(() => {
            process.exit(1);
        });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default connection;
    const { Pool } = require('pg'); // Do komunikacji z bazą danych PostgreSQL

    // Konfiguracja bazy danych PostgreSQL

    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,

        max: 10, // maksymalna liczba połączeń w puli
        idleTimeoutMillis: 30000, // czas bezczynności przed zamknięciem połączenia
        connectionTimeoutMillis: 2000, // czas oczekiwania na połączenie
        
    });
    module.exports = pool;
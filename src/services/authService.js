const argon2 = require('argon2');
const pool = require('../config/db'); // Import konfiguracji bazy danych

const registerUser = async (username, password) => {
    
    // Hashowanie hasła
    const passwordHash = await argon2.hash(password);

    // Zapis użytkownika w bazie danych
    const result = await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
        [username, passwordHash]
    );
    return result.rows[0].id;
}   

module.exports = {
    registerUser
};


const rateLimit = require('express-rate-limit'); // Do ograniczania liczby żądań


// Konfiguracja limitera dla endpointu logowania
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 10, // limit 10 żądań na okno czasowe
    message: {message: 'Zbyt wiele prób logowania, spróbuj ponownie później'},
    standardHeaders: true,
    legacyHeaders: false,
});
// Konfiguracja limitera dla endpointu rejestracji
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 godzina
    max: 5, // limit 5 żądań na okno czasowe
    message: {message: 'Zbyt wiele prób rejestracji, spróbuj ponownie później'},
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    registerLimiter
};
//Import bibliotek i frameworków
require('dotenv').config(); // Do zarządzania zmiennymi środowiskowymi
const authService = require('./services/authService'); // Import serwisu autoryzacji
const express = require('express'); // Framework do tworzenia serwera
const argon2 = require('argon2'); 
const pool = require('./config/db'); // Import konfiguracji bazy danych
const jwt = require('jsonwebtoken'); // Do generowania tokenów JWT
const verifyToken = require('./middlewares/authMiddleware'); // Middleware do weryfikacji tokenów
const path = require('path'); // Do obsługi sciezki do plików
const {loginLimiter, registerLimiter} = require('./middlewares/rateLimiter'); // Import limiterów dla endpointów logowania i rejestracji



// Inicjalizacja aplikacji Express

const app = express(); // Tworzenie instancji aplikacji Express
app.use(express.static(path.join(__dirname, '..', 'public'))); // Middleware do obsługi statycznych plików (HTML, CSS, JS) z katalogu 'public'
app.use(express.json()); // Middleware do parsowania JSON w ciele żądań

// Endpoint do pobierania informacji o aktualnie zalogowanym użytkowniku
app.get('/api/me', verifyToken, async (req, res) => {
 res.json({userId: req.user.id,
     username: req.user.username});
}); 




 
// Endpoint register

const register = async (req, res) => {
    try {
        const {username, password} = req.body;
        if (!username || !password) {
            return res.status(400).json({message: 'Brak nazwy użytkownika lub hasła'});
        }
        if (username.length < 3 || password.length < 20) {
            return res.status(400).json({message: 'Nazwa użytkownika musi mieć co najmniej 3 znaki, a hasło co najmniej 20 znaków'});
        }
        // dozwolone znaki w loginie
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({message: 'Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia'});
        }

        // walidacja hasla
     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({message: 'Hasło musi zawierać co najmniej 8 znaków, w tym małą literę, wielką literę, cyfrę i znak specjalny'});
        };

// Endpoint logowania
app.post('/login', loginLimiter, async (req, res) => {
    try {
        const {username, password} = req.body; 
        if (!username || !password) {              
            return res.status(400).json({message: 'Brak nazwy użytkownika lub hasła'});
           }
        // Pobranie użytkownika z bazy danych
        const {rows} = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        const user = rows[0];
       
        if (!user) {
            return res.status(401).json({message: 'Nie prawidłowe dane logowania'});
        }  
        // Weryfikacja hasła
        const validPassword = await argon2.verify(user.password_hash, password);
        if (!validPassword){
            return res.status(401).json({message: 'Nie prawidłowe dane logowania'});
        } 
        // 
        const token = jwt.sign({userId: user.id, username: user.username}, 
            process.env.JWT_SECRET, {expiresIn: '1h'});
        res.status(200).json({message: 'Zalogowano pomyślnie', token: token});  
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Błąd serwera'});
    }
});

// Endpoint dashboard - chroniona strona
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'protected', 'dashboard.html'));
});


// Uruchomienie serwera
app.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});


//Import bibliotek i framewokrków
require('dotenv').config(); // Do zarządzania zmiennymi środowiskowymi
const express = require('express');
const argon2 = require('argon2');
const { Pool } = require('pg'); // Do komunikacji z bazą danych PostgreSQL
const session = require('express-session'); // Do zarządzania sesjami użytkowników
const PgSession = require('connect-pg-simple')(session); // Do przechowywania sesji w bazie danych PostgreSQLs
const cookieParser = require('cookie-parser'); // Do parsowania ciasteczek
const path = require('path'); // Do obsługi sciezki do plików

// Inicjalizacja aplikacji Express

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());
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

// Konfiguracja sesji
app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'sessions',
    }),
    name: 'sessionId',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60, // 1 sgodzina
        secure: false,
    }
}));

// Import biblioteki do ograniczania liczby żądań
const rateLimit = require('express-rate-limit');
// Konfiguracja limitera dla endpointu logowania
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 10, // limit 10 żądań na okno czasowe
    message: {message: 'Zbyt wiele prób logowania, spróbuj ponownie za 15 minut'},
    standardHeaders: true,
    legacyHeaders: false,
})
// Konfiguracja limitera dla endpointu rejestracji
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 godzina
    max: 5, // limit 5 żądań na okno czasowe
    message: {message: 'Zbyt wiele prób rejestracji, spróbuj ponownie za godzinę'},
    standardHeaders: true,
    legacyHeaders: false,
});

 



// Endpoint register
app.post('/register', registerLimiter, async (req, res) => {
    try {
        const {username, password} = req.body;
         // Walidacja danych wejściowych
        if (!username || !password) {              
         return res.status(400).json({message: 'Brak nazwy użytkownika lub hasła'});
        }
        // Sprawdzenie długości loginu
        if (username.length < 3 || username.length > 20) {
          return res.status(400).json({message:'Nazwa użytkownika musi mieć od 3 do 20 znaków'});
        }
        //Dozwolone znaki w loginie
        if (!/^[a-zA-Z0-9_]+$/.test(username)){
            return res.status(400).json({message: 'Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia'});

        }

        // Walidacja hasła
        if (password.length < 6 || password.length > 20 || !/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])/.test(password)) {
            return res.status(400).json({message: 'Hasło musi mieć od 6 do 20 znaków, zawierać co najmniej jedną wielką literę, jedną cyfrę i jeden znak specjalny'});
        }

        // Hashowanie hasła
        const passwordHash = await argon2.hash(password); 

        // Zapis użytkownika w bazie danych
       const result = await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
        [username, passwordHash]
         );
        res.status(201).json({message: 'Użytkownik zarejestrowany pomyślnie', userId: result.rows[0].id});
    } catch (error) {
        console.error(error);
        if(error.code === '23505'){ // Kod błędu unikalnego naruszenia w PostgreSQL
            return res.status(409).json({message: 'Nazwa użytkownika jest już zajęta'});
        }
        
        res.status(500).json({message: 'Błąd serwera'});
        }
        
});
// Endpoint logowania
app.post('/login', loginLimiter, async (req, res) => {
    try {
        // Wyciągnięcie danych z żądania
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
            return res.status(404).json({message: 'Użytkownik nie istnieje'});
        }  
        // Weryfikacja hasła
        const validPassword = await argon2.verify(user.password_hash, password);
        if (!validPassword){
            return res.status(401).json({message: 'Nieprawidłowe hasło'});
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        res.status(200).json({message: 'Zalogowano pomyślnie'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Błąd serwera'});
    }
});
// Middleware sessji globalnej

function requireLogin(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        
       res.redirect('/index.html'); // Jeśli użytkownik nie jest zalogowany, przekieruj na stronę logowania
    }
}

// Endpoint do pobierania informacji o zalogowanym użytkowniku 

app.get('/me', requireLogin, (req, res) => {
    res.status(200).json({  username: req.session.username});
});

// Endpoint dashboard - chroniona strona
app.get('/dashboard.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'protected', 'dashboard.html'));
});

// Endpoint wylogowania
app.post('/logout', requireLogin, (req, res) => {
    req.session.destroy((err) => {
        if (err) { 
            console.error(err);
            return res.status(500).json({message: 'Nie udało się wylogować'});
        }
        // Usunięcie ciasteczka sesji
        res.clearCookie('sessionId');

         return   res.status(200).json({message: 'Wylogowano pomyślnie'});

    });
});


// Uruchomienie serwera
app.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});


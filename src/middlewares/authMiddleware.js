const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization; // Pobierz nagłówek Authorization
   if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Brak tokenu autoryzacyjnego'});
    }

    const token = authHeader.split(' ')[1]; // Pobierz token z nagłówka
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Przechowaj dane użytkownika w obiekcie req.user
        next(); // Przejdź do następnego middleware lub endpointu
    } catch (error) {
        return res.status(401).json({message: 'Nieprawidłowy token'});
    }
}       
module.exports = verifyToken;
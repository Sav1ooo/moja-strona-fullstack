// Endpoint register

const register = async (req, res) => {
    try {
        const {username, password} = req.body;
        if (!username || !password) {
            return res.status(400).json({message: 'Brak nazwy użytkownika lub hasła'});
        }
        if (username.length < 3 || password.length < 8) {
            return res.status(400).json({message: 'Nazwa użytkownika musi mieć co najmniej 3 znaki, a hasło co najmniej 8 znaków'});
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
        
        const userId = await authService.registerUser(username, password);
        res.status(201).json({message: 'Użytkownik zarejestrowany pomyślnie', userId: userId});
    } catch (error) {
        console.error(error);
        if (error.code === '23505') { // Kod błędu dla unikalnego naruszenia (np. duplikat nazwy użytkownika)
          return res.status(409).json({message: 'Nazwa użytkownika jest już zajęta'});      
    }
     res.status(500).json({message: 'Błąd serwera'});
    }
};  

module.exports = {
    register
};
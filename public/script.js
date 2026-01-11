// FRONTEND

// Menu hamburger
const hamburger = document.querySelector('.menu-open');
hamburger.addEventListener('click', showMenu);

    function showMenu() {
        document.querySelector('.menu').style.display = 'block';
        document.querySelector('.menu-open').style.display = 'none';
        document.querySelector('.menu-close').style.display = 'block';
    }
  const close = document.querySelector('.menu-close');
  close.addEventListener('click', hideMenu);
    function hideMenu() {
        document.querySelector('.menu').style.display = 'none';
        document.querySelector('.menu-open').style.display = 'block';
        document.querySelector('.menu-close').style.display = 'none';
    }
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            document.querySelector('.menu').style.display = '';
            document.querySelector('.menu-open').style.display = '';
            document.querySelector('.menu-close').style.display = '';
        }
    });
    // Formularz rejestracyjny
    const registerForm = document.getElementById('registerForm');
    if (registerForm) { 
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('reg-message');

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({username, password}),
                });

                const data = await response.json();
                msg.textContent = data.message;
                msg.className = response.ok ? 'message' : 'error';
            } catch (error) {
                msg.textContent = 'Błąd sieci. Spróbuj ponownie później.';
                msg.className = 'error';
            }
        });
    }
    // Pobranie formularza logowania
    const loginForm = document.getElementById('loginForm');
    if (loginForm) { 
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

            // Pobranie wartości z formularza
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('login-message');


            try {
                 // Wysłanie żądania POST do backendu
           const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password}),
        });
           const data = await response.json(); // Odczytanie odpowiedzi z backendu
           msg.textContent = data.message; // Wyświetlenie komunikatu użytkownikowi
           msg.className = response.ok ? 'message' : 'error'; // Ustawienie klasy CSS na podstawie sukcesu lub błędu
            if (response.ok) {
                // Przekierowanie na stronę dashboard po udanym logowaniu
                window.location.href = '/dashboard.html'; }
            } catch (error) {
                msg.textContent = 'Błąd sieci. Spróbuj ponownie później.';
                msg.className = 'error';
            }
        });
    }

        // Endpoint wylogowania
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                try {
                    const response = await fetch('/logout', {
                        method: 'POST',
                        credentials: 'include', // Upewnij się, że ciasteczka sesji są wysyłane
                    });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    window.location.href = '/index.html'; // Przekierowanie na stronę główną po wylogowaniu
                } else   {alert('Błąd podczas wylogowywania: ' + data.message);}
                } catch (error) {
                    console.error(error);
                    alert('Błąd sieci. Spróbuj ponownie później.');
                }
            });
        }

           // Sprawdzanie statusu logowania
           async function checkLogin() {
            const authSection = document.getElementById('authSection');
            try {
                 const response = await fetch('/me', {
                    credentials: 'include',
                });
                
                 if(response.ok) {
                   const data = await response.json();
                    console.log('Zalogowany jako:', data.username);
                    if(authSection) {
                        authSection.style.display = 'none';
                    }
                 } else { 
                    // Użytkownik nie zalogowany
                    if(authSection) {
                        authSection.style.display = 'block';
                    }
                }
            } catch (error) {
                
                console.error('Błąd podczas sprawdzania statusu logowania:', error);
                if(authSection) {
                    authSection.style.display = 'block';
           }
            }
        }
        checkLogin();




// Pobierz przyciski modalne i same modale
const modalButtons = document.querySelectorAll('.modal-button');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-btn');

// Otwórz modale
modalButtons.forEach(button => {
    button.onclick = function(event) {
        const modalId = button.getAttribute('href').substring(1); // Pobierz id docelowego modalu
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
    };
});

// Zamknij modale po kliknięciu przycisku zamknięcia
closeButtons.forEach(button => {
    button.onclick = function() {
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    };
});

// Zamknij modale po kliknięciu poza treścią modalu
window.onclick = function(event) {
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
};

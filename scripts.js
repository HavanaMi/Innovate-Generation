// Pobierz wszystkie przyciski otwierające modale oraz same modale
const modalButtons = document.querySelectorAll('.modal-button');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-btn');

// Otwórz modal po kliknięciu na przycisk
modalButtons.forEach(button => {
    button.onclick = function(event) {
        const modalId = button.getAttribute('href').substring(1); // Pobierz id docelowego modalu
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
    };
});

// Zamknij modal po kliknięciu na przycisk zamknięcia
closeButtons.forEach(button => {
    button.onclick = function() {
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    };
});

// Zamknij modal po kliknięciu poza treścią modalu
window.onclick = function(event) {
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

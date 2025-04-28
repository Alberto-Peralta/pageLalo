// Mostrar u ocultar el menú en dispositivos móviles
function toggleMenu() {
    var menu = document.getElementById('menu');
    menu.classList.toggle('show');
}

// Copiar el número de cuenta
function copyAccount() {
    var accountNumber = document.getElementById('account-number').innerText;
    navigator.clipboard.writeText(accountNumber).then(function() {
        var message = document.getElementById('copied-message');
        message.style.display = 'block';
        setTimeout(function() {
            message.style.display = 'none';
        }, 2000);
    }, function(err) {
        console.error('Error al copiar el texto: ', err);
    });
}

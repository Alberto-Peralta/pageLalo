// Mostrar u ocultar el menú en dispositivos móviles
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('show'); // Agrega o elimina la clase 'show'
}






// Copiar el número de cuenta
function copyAccount() {
    const accountInput = document.getElementById("account-number");
    accountInput.select();
    accountInput.setSelectionRange(0, 99999); // Para móviles también
    document.execCommand("copy");

    const copiedMessage = document.getElementById("copied-message");
    copiedMessage.style.display = "inline";

    // Opcional: esconder el mensaje después de 2 segundos
    setTimeout(() => {
        copiedMessage.style.display = "none";
    }, 2000);
}

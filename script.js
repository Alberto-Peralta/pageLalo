// Mostrar u ocultar el menú en dispositivos móviles
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('show'); // Agrega o elimina la clase 'show'
}

// --- NUEVA FUNCIÓN PARA LAS CARDS DESPLEGABLES ---
function toggleCollapse(element) {
    // Alterna la clase 'active' en la tarjeta que fue clickeada
    element.classList.toggle('active');
}


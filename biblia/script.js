document.addEventListener('DOMContentLoaded', function() {
    const iframe = document.getElementById('bibleIframe');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    let currentChapter = 3; // Valor inicial, el capítulo de Juan 3

    // Función para actualizar el iframe
    function updateIframe() {
        iframe.src = `https://cem.org.mx/biblia/+${currentChapter}&version=RVR1960`;
        prevBtn.disabled = currentChapter === 1; // Desactivar el botón de "Anterior" si estamos en el primer capítulo
        nextBtn.disabled = currentChapter === 21; // Desactivar el botón de "Siguiente" si estamos en el último capítulo
    }

    // Evento para el botón "Anterior"
    prevBtn.addEventListener('click', function() {
        if (currentChapter > 1) {
            currentChapter--;
            updateIframe();
        }
    });

    // Evento para el botón "Siguiente"
    nextBtn.addEventListener('click', function() {
        if (currentChapter < 21) { // Asumiendo que estamos usando el libro de Juan, con 21 capítulos
            currentChapter++;
            updateIframe();
        }
    });

    // Inicializar el iframe con el capítulo inicial
    updateIframe();
});

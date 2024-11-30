document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".menu");

    menuToggle.addEventListener("click", () => {
        menu.classList.toggle("show");
    });

    // Cierra el menú al hacer clic fuera de él
    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
            menu.classList.remove("show");
        }
    });
});




// Detectar el scroll
window.addEventListener('scroll', function() {
    const imageContainer = document.querySelector('.image-container');
    const overlayText = document.querySelector('.overlay-text');
    const image = document.querySelector('.background-image');
    
    const scrollPosition = window.scrollY;
    const fadeThreshold = imageContainer.offsetTop + imageContainer.offsetHeight / 2;
    
    if (scrollPosition > fadeThreshold) {
        // Aplicar la clase fade-out cuando se haya hecho scroll suficiente
        overlayText.classList.add('fade-out');
        image.classList.add('fade-out');
    } else {
        // Eliminar la clase fade-out cuando el scroll está por encima del umbral
        overlayText.classList.remove('fade-out');
        image.classList.remove('fade-out');
    }
});







document.addEventListener("DOMContentLoaded", function() {
    const cards = document.querySelectorAll(".card");

    // Función que se ejecuta cuando las tarjetas entran en la vista
    const observerOptions = {
        threshold: 0.5  // Activar cuando la tarjeta esté al 50% en la vista
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("fade-in"); // Aplica la clase para animación
                observer.unobserve(entry.target); // Deja de observar la tarjeta
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        observer.observe(card); // Observa cada tarjeta
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const servicesCarousel = document.getElementById('services-carousel');
    const socialCarousel = document.getElementById('social-carousel');

    // Función para deslizar el carrusel
    function slideCarousel(carousel) {
        const scrollAmount = 250; // Ajusta la cantidad de desplazamiento
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setTimeout(() => {
            if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
                carousel.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }, 1000); // Ajusta el tiempo según sea necesario
    }

    // Intervalo para deslizar el carrusel
    setInterval(() => {
        slideCarousel(servicesCarousel);
        slideCarousel(socialCarousel);
    }, 3000); // Cambia la cantidad de milisegundos para el intervalo
});


function copyToClipboard(elementId) {
    const textToCopy = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Número copiado: ' + textToCopy); // Mensaje de confirmación
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}


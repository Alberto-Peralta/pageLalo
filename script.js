document.addEventListener("DOMContentLoaded", () => {
    // Menú desplegable
    const menuToggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".menu");
    if (menuToggle && menu) {
        menuToggle.addEventListener("click", () => menu.classList.toggle("show"));
        document.addEventListener("click", (event) => {
            if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
                menu.classList.remove("show");
            }
        });
    }

    // Animación al hacer scroll
    const imageContainer = document.querySelector(".image-container");
    const overlayText = document.querySelector(".overlay-text");
    const image = document.querySelector(".background-image");
    if (imageContainer && overlayText && image) {
        window.addEventListener("scroll", () => {
            const scrollPosition = window.scrollY;
            const fadeThreshold = imageContainer.offsetTop + imageContainer.offsetHeight / 2;
            const action = scrollPosition > fadeThreshold ? "add" : "remove";
            overlayText.classList[action]("fade-out");
            image.classList[action]("fade-out");
        });
    }

    // Animación de tarjetas
    const cards = document.querySelectorAll(".card");
    if (cards.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(({ isIntersecting, target }) => {
                    if (isIntersecting) {
                        target.classList.add("fade-in");
                        observer.unobserve(target);
                    }
                });
            },
            { threshold: 0.1 } // Cambiado a 0.1 para que se active antes
        );
        cards.forEach((card) => observer.observe(card));
    }

    // Carruseles
    const carousels = ["services-carousel", "social-carousel"].map((id) => document.getElementById(id));
    const slideCarousel = (carousel) => {
        if (!carousel) return;
        const scrollAmount = 376; // Cantidad de desplazamiento
        const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth; // Máximo desplazamiento
        // Desplazarse normalmente
        carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
        // Si se llega al final, se vuelve a empezar sin pausa
        if (carousel.scrollLeft + scrollAmount >= maxScrollLeft) {
            setTimeout(() => {
                carousel.scrollTo({ left: 0, behavior: "smooth" });
            }, 2000); // Tiempo antes de reiniciar el desplazamiento
        }
    };

    // Configurar el desplazamiento automático de los carruseles
    carousels.forEach((carousel) => {
        if (carousel) setInterval(() => slideCarousel(carousel), 3000); // Cambia el intervalo según sea necesario
    });

    // Copiar al portapapeles
    window.copyToClipboard = (elementId) => {
        const textToCopy = document.getElementById(elementId)?.innerText;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .catch((err) => console.error("Error al copiar:", err));
        }
    };
});






// Carruseles
const carousels = ["services-carousel", "social-carousel"].map((id) => document.getElementById(id));
const setupCarousel = (carousel) => {
    if (!carousel) return;

    // Duplicar el contenido del carrusel
    const carouselContent = carousel.innerHTML;
    carousel.innerHTML += carouselContent;

    const scrollSpeed = 1; // Velocidad del desplazamiento (pixeles por frame)

    const startScrolling = () => {
        if (carousel.scrollLeft >= carousel.scrollWidth / 2) {
            // Cuando alcanza el final de la primera copia, vuelve al inicio sin interrupción
            carousel.scrollLeft = 0;
        }
        carousel.scrollLeft += scrollSpeed;
    };

    let interval = setInterval(startScrolling, 15); // Ajusta el intervalo según la suavidad deseada

     // Pausar y reanudar el desplazamiento en dispositivos de escritorio
     carousel.addEventListener("mouseenter", () => clearInterval(interval));
     carousel.addEventListener("mouseleave", () => {
         interval = setInterval(startScrolling, 20);
     });

     // Pausar y reanudar el desplazamiento en dispositivos móviles
     carousel.addEventListener("touchstart", () => clearInterval(interval));
     carousel.addEventListener("touchend", () => {
         interval = setInterval(startScrolling, 20);
     });
};

// Configurar cada carrusel
carousels.forEach(setupCarousel);

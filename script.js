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
            { threshold: 0.5 }
        );

        cards.forEach((card) => observer.observe(card));
    }

// Carruseles
const carousels = ["services-carousel", "social-carousel"].map((id) =>
    document.getElementById(id)
);

const slideCarousel = (carousel) => {
    if (!carousel) return;

    const scrollAmount = 250; // Cantidad de desplazamiento
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth; // Máximo desplazamiento
    const tolerance = 5; // Tolerancia en píxeles para evitar errores de redondeo

    if (carousel.scrollLeft + carousel.clientWidth >= maxScrollLeft - tolerance) {
        // Pausa en la última tarjeta antes de reiniciar
        setTimeout(() => {
            carousel.scrollTo({ left: 0, behavior: "auto" });
        }, 2000); // Tiempo de pausa en milisegundos
    } else {
        // Desplazarse normalmente
        carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
};

// Configurar el desplazamiento automático de los carruseles
carousels.forEach((carousel) => {
    if (carousel) setInterval(() => slideCarousel(carousel), 2000);
});


    // Copiar al portapapeles
    window.copyToClipboard = (elementId) => {
        const textToCopy = document.getElementById(elementId)?.innerText;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                //.then(() => alert(`Número copiado: ${textToCopy}`))
                .catch((err) => console.error("Error al copiar:", err));
        }
    };
});

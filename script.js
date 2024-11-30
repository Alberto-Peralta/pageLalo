document.addEventListener("DOMContentLoaded", function () {
    // Menú desplegable
    const menuToggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".menu");

    menuToggle.addEventListener("click", () => menu.classList.toggle("show"));

    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
            menu.classList.remove("show");
        }
    });

    // Animación al hacer scroll
    const imageContainer = document.querySelector('.image-container');
    const overlayText = document.querySelector('.overlay-text');
    const image = document.querySelector('.background-image');

    if (imageContainer && overlayText && image) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const fadeThreshold = imageContainer.offsetTop + imageContainer.offsetHeight / 2;

            if (scrollPosition > fadeThreshold) {
                overlayText.classList.add('fade-out');
                image.classList.add('fade-out');
            } else {
                overlayText.classList.remove('fade-out');
                image.classList.remove('fade-out');
            }
        });
    }

    // Animación de tarjetas
    const cards = document.querySelectorAll(".card");
    if (cards.length > 0) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("fade-in");
                        observer.unobserve(entry.target); // Dejar de observar para mejorar el rendimiento
                    }
                });
            },
            { threshold: 0.5 } // Activar cuando esté al 50% visible
        );

        cards.forEach((card) => observer.observe(card));
    }

    // Carruseles
    const carousels = [
        document.getElementById("services-carousel"),
        document.getElementById("social-carousel"),
    ];

    function slideCarousel(carousel) {
        if (!carousel) return;

        const scrollAmount = 250;
        carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });

        setTimeout(() => {
            if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1) {
                carousel.scrollTo({ left: 0, behavior: "auto" });
            }
        }, 600);
    }

    carousels.forEach((carousel) => {
        if (carousel) {
            setInterval(() => slideCarousel(carousel), 3000);
        }
    });

    // Función copiar al portapapeles
    window.copyToClipboard = (elementId) => {
        const textToCopy = document.getElementById(elementId)?.innerText;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => alert(`Número copiado: ${textToCopy}`))
                .catch((err) => console.error("Error al copiar:", err));
        }
    };
});

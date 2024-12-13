// Aquí puedes añadir funcionalidades extra con JavaScript

// Ejemplo de recarga del iframe
const recargarIframe = () => {
    const iframe = document.querySelector('iframe');
    iframe.contentWindow.location.reload();
};

// Este código es opcional, pero si quieres añadir un botón para recargar la Biblia
// const botonRecargar = document.createElement('button');
// botonRecargar.textContent = 'Recargar la Biblia';
botonRecargar.onclick = recargarIframe;
document.body.appendChild(botonRecargar);

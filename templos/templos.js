// templos.js
import { database } from './firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let templosData = [];

// Cargar templos desde Firebase
function cargartemplos() {
    const templosRef = ref(database, 'templos');
    
    onValue(templosRef, (snapshot) => {
        const container = document.getElementById('templosContainer');
        container.innerHTML = '';
        templosData = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            Object.keys(data).forEach(key => {
                const templo = { id: key, ...data[key] };
                templosData.push(templo);
            });
            
            rendertemplos(templosData);
        } else {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-church"></i>
                    <p>No hay templos registradas aún</p>
                </div>
            `;
        }
    }, (error) => {
        console.error('Error al cargar Templos:', error);
        const container = document.getElementById('templosContainer');
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las templos</p>
            </div>
        `;
    });
}

// Renderizar templos en la página
function rendertemplos(templos) {
    const container = document.getElementById('templosContainer');
    container.innerHTML = '';
    
    if (templos.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i>
                <p>No se encontraron templos</p>
            </div>
        `;
        return;
    }
    
    templos.forEach(templo => {
        const card = crearCardtemplo(templo);
        container.innerHTML += card;
    });
}

// Crear card HTML para cada templo
function crearCardtemplo(templo) {
    // Obtener primera imagen o imagen por defecto
    const imagenUrl = (templo.imagenes && templo.imagenes.length > 0) 
        ? templo.imagenes[0] 
        : 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&h=300&fit=crop';
    
    const horarios = templo.horarios || {};
    
    // Mostrar primeros 2 días con horarios
    let horariosHTML = '';
    let diasMostrados = 0;
    
    Object.keys(horarios).forEach(dia => {
        if (diasMostrados < 2 && horarios[dia] && horarios[dia].length > 0) {
            const horariosDelDia = Array.isArray(horarios[dia]) 
                ? horarios[dia].join(', ') 
                : horarios[dia];
            horariosHTML += `<div class="horario-item">${dia}: ${horariosDelDia}</div>`;
            diasMostrados++;
        }
    });
    
    return `
        <div class="templo-card" onclick="mostrarDetalle('${templo.id}')">
            <img src="${imagenUrl}" alt="${templo.nombre}" class="templo-imagen" onerror="this.src='https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&h=300&fit=crop'">
            <div class="templo-info">
                <h3 class="templo-nombre">${templo.nombre}</h3>
                <div class="templo-direccion">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${templo.direccion || 'Dirección no disponible'}</span>
                </div>
                <p class="templo-descripcion">${templo.descripcion || 'Sin descripción'}</p>
                ${horariosHTML ? `
                    <div class="templo-horarios">
                        <h4><i class="fas fa-clock"></i> Horarios de Misa</h4>
                        ${horariosHTML}
                    </div>
                ` : ''}
                <button class="btn-ver-mas" onclick="event.stopPropagation(); mostrarDetalle('${templo.id}')">
                    Ver más detalles <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

// Mostrar detalle completo en modal
window.mostrarDetalle = function(id) {
    const templo = templosData.find(p => p.id === id);
    if (!templo) return;
    
    // Carrusel de imágenes
    const imagenes = templo.imagenes && templo.imagenes.length > 0 
        ? templo.imagenes 
        : ['https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&h=400&fit=crop'];
    
    let imagenesHTML = '';
    if (imagenes.length > 1) {
        imagenesHTML = `
            <div class="modal-imagenes-carousel">
                <button class="carousel-btn prev" onclick="cambiarImagen(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <img id="modalImagenActual" src="${imagenes[0]}" alt="${templo.nombre}" class="modal-imagen" onerror="this.src='https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&h=400&fit=crop'">
                <button class="carousel-btn next" onclick="cambiarImagen(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="carousel-indicators">
                    ${imagenes.map((_, idx) => `<span class="indicator ${idx === 0 ? 'active' : ''}" onclick="irAImagen(${idx})"></span>`).join('')}
                </div>
            </div>
        `;
        
        // Guardar imágenes para el carrusel
        window.imagenesCarrusel = imagenes;
        window.imagenActualIndex = 0;
    } else {
        imagenesHTML = `<img src="${imagenes[0]}" alt="${templo.nombre}" class="modal-imagen" onerror="this.src='https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&h=400&fit=crop'">`;
    }
    
    const horarios = templo.horarios || {};
    const avisos = templo.avisos || [];
    
    // Renderizar horarios (ahora múltiples por día)
    let horariosHTML = '';
    Object.keys(horarios).forEach(dia => {
        if (horarios[dia] && horarios[dia].length > 0) {
            const horariosDelDia = Array.isArray(horarios[dia]) 
                ? horarios[dia].join(', ') 
                : horarios[dia];
            horariosHTML += `<div class="horario-item"><strong>${dia}:</strong> ${horariosDelDia}</div>`;
        }
    });
    
    let avisosHTML = '';
    if (avisos.length > 0) {
        avisos.forEach(aviso => {
            avisosHTML += `<div class="aviso-item">${aviso}</div>`;
        });
    } else {
        avisosHTML = '<p>No hay avisos en este momento</p>';
    }
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        ${imagenesHTML}
        <h2>${templo.nombre}</h2>
        <div class="templo-direccion" style="margin: 1rem 0;">
            <i class="fas fa-map-marker-alt"></i>
            <span>${templo.direccion || 'Dirección no disponible'}</span>
        </div>
        <p>${templo.descripcion || 'Sin descripción'}</p>
        
        ${horariosHTML ? `
            <div class="modal-horarios">
                <h3><i class="fas fa-clock"></i> Horarios de Misa</h3>
                ${horariosHTML}
            </div>
        ` : ''}
        
        <div class="modal-avisos">
            <h3><i class="fas fa-bullhorn"></i> Avisos Parroquiales</h3>
            ${avisosHTML}
        </div>
        
        ${templo.ubicacion && templo.ubicacion.googleMapsUrl ? `
            <a href="${templo.ubicacion.googleMapsUrl}" 
               target="_blank" 
               class="btn-ubicacion">
                <i class="fas fa-location-arrow"></i>
                Abrir en Google Maps
            </a>
        ` : templo.direccion ? `
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(templo.direccion)}" 
               target="_blank" 
               class="btn-ubicacion">
                <i class="fas fa-map-marker-alt"></i>
                Ver en Google Maps
            </a>
        ` : ''}
    `;
    
    document.getElementById('modalDetalle').style.display = 'block';
}

// Funciones para el carrusel de imágenes
window.cambiarImagen = function(direccion) {
    if (!window.imagenesCarrusel || window.imagenesCarrusel.length <= 1) return;
    
    window.imagenActualIndex += direccion;
    
    if (window.imagenActualIndex >= window.imagenesCarrusel.length) {
        window.imagenActualIndex = 0;
    } else if (window.imagenActualIndex < 0) {
        window.imagenActualIndex = window.imagenesCarrusel.length - 1;
    }
    
    const imgElement = document.getElementById('modalImagenActual');
    if (imgElement) {
        imgElement.src = window.imagenesCarrusel[window.imagenActualIndex];
        actualizarIndicadores();
    }
}

window.irAImagen = function(index) {
    if (!window.imagenesCarrusel || window.imagenesCarrusel.length <= 1) return;
    
    window.imagenActualIndex = index;
    const imgElement = document.getElementById('modalImagenActual');
    if (imgElement) {
        imgElement.src = window.imagenesCarrusel[window.imagenActualIndex];
        actualizarIndicadores();
    }
}

function actualizarIndicadores() {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, idx) => {
        if (idx === window.imagenActualIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// Cerrar modal
window.cerrarModal = function() {
    document.getElementById('modalDetalle').style.display = 'none';
    window.imagenesCarrusel = null;
    window.imagenActualIndex = 0;
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modalDetalle');
    if (event.target == modal) {
        cerrarModal();
    }
}

// Filtrar templos
window.filtertemplos = function() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtradas = templosData.filter(templo => {
        return templo.nombre.toLowerCase().includes(searchTerm) ||
               (templo.direccion && templo.direccion.toLowerCase().includes(searchTerm)) ||
               (templo.descripcion && templo.descripcion.toLowerCase().includes(searchTerm));
    });
    rendertemplos(filtradas);
}

// Detectar búsqueda secreta para mostrar panel admin
function configurarBusquedaSecreta() {
    const searchInput = document.getElementById('searchInput');
    const btnAdmin = document.getElementById('btnAdmin');
    let timer;

    searchInput.addEventListener('input', function(e) {
        clearTimeout(timer);
        const valor = e.target.value.toLowerCase().trim();
        
        if (valor === '' || valor !== 'panel admin') {
            btnAdmin.classList.remove('mostrar');
            return;
        }

        timer = setTimeout(() => {
            btnAdmin.classList.add('mostrar');
            
            setTimeout(() => {
                searchInput.value = '';
                filtertemplos();
            }, 1000);
            
        }, 500);
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const valor = e.target.value.toLowerCase().trim();
            if (valor === 'panel admin') {
                e.preventDefault();
                btnAdmin.classList.add('mostrar');
                searchInput.value = '';
                filtertemplos();
            }
        }
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargartemplos();
    configurarBusquedaSecreta();
});
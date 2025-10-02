// admin.js
import { database, storage, auth } from './firebase-config.js';
import { ref, push, set, remove, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let templosData = [];
let editandoId = null;
let imagenesActuales = []; // Array para almacenar imágenes actuales

// Verificar autenticación al cargar
onAuthStateChanged(auth, (user) => {
    if (user) {
        mostrarPanelAdmin(user);
    } else {
        mostrarPantallaLogin();
    }
});

function mostrarPanelAdmin(user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('userEmail').textContent = user.email;
    cargartemplos();
}

function mostrarPantallaLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await iniciarSesion();
        });
    }

    // Logout button
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    // Nueva templo button
    const btnNueva = document.getElementById('btnNueva');
    if (btnNueva) {
        btnNueva.addEventListener('click', mostrarFormulario);
    }

    // Close form button
    const btnCloseForm = document.getElementById('btnCloseForm');
    if (btnCloseForm) {
        btnCloseForm.addEventListener('click', cerrarFormulario);
    }

    // Cancelar button
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarFormulario);
    }

    // Form submit
    const temploForm = document.getElementById('temploForm');
    if (temploForm) {
        temploForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardartemplo();
        });
    }

    // Add aviso button
    const btnAddAviso = document.getElementById('btnAddAviso');
    if (btnAddAviso) {
        btnAddAviso.addEventListener('click', agregarAviso);
    }

    // Botón de ubicación automática
    const btnUbicacionAuto = document.getElementById('btnUbicacionAuto');
    if (btnUbicacionAuto) {
        btnUbicacionAuto.addEventListener('click', obtenerUbicacionActual);
    }

    // Cambio de tipo de imagen (Upload vs URL)
    const tipoImagen = document.getElementById('tipoImagen');
    if (tipoImagen) {
        tipoImagen.addEventListener('change', (e) => {
            const imagenUpload = document.getElementById('imagenUpload');
            const imagenUrl = document.getElementById('imagenUrl');
            
            if (e.target.value === 'upload') {
                imagenUpload.style.display = 'block';
                imagenUrl.style.display = 'none';
                imagenUrl.value = '';
            } else {
                imagenUpload.style.display = 'none';
                imagenUpload.value = '';
                imagenUrl.style.display = 'block';
            }
        });
    }

    // Agregar imagen
    const btnAddImagen = document.getElementById('btnAddImagen');
    if (btnAddImagen) {
        btnAddImagen.addEventListener('click', agregarImagen);
    }

    // Delegación de eventos para botones dinámicos
    document.addEventListener('click', (e) => {
        // Eliminar aviso
        if (e.target.closest('.btn-remove-aviso')) {
            removerAviso(e.target.closest('.btn-remove-aviso'));
        }
        
        // Agregar horario
        if (e.target.closest('.btn-add-horario')) {
            const btn = e.target.closest('.btn-add-horario');
            agregarHorario(btn.dataset.dia);
        }
        
        // Eliminar horario
        if (e.target.closest('.btn-remove-horario')) {
            removerHorario(e.target.closest('.btn-remove-horario'));
        }
        
        // Eliminar imagen
        if (e.target.closest('.btn-remove-imagen')) {
            const btn = e.target.closest('.btn-remove-imagen');
            removerImagen(btn.dataset.index);
        }
    });
});

// Iniciar sesión
async function iniciarSesion() {
    const email = document.getElementById('emailLogin').value;
    const password = document.getElementById('passwordLogin').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        errorDiv.style.display = 'none';
    } catch (error) {
        errorDiv.textContent = 'Credenciales incorrectas. Intenta de nuevo.';
        errorDiv.style.display = 'block';
        console.error('Error de login:', error);
    }
}

// Cerrar sesión
async function cerrarSesion() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}

// Cargar templos
function cargartemplos() {
    const templosRef = ref(database, 'templos');
    
    onValue(templosRef, (snapshot) => {
        const lista = document.getElementById('templosList');
        lista.innerHTML = '';
        templosData = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            Object.keys(data).forEach(key => {
                const templo = { id: key, ...data[key] };
                templosData.push(templo);
            });
            
            rendertemplosAdmin(templosData);
        } else {
            lista.innerHTML = `
                <div class="loading">
                    <i class="fas fa-church"></i>
                    <p>No hay templos registradas. ¡Agrega la primera!</p>
                </div>
            `;
        }
    });
}

// Renderizar templos en admin
function rendertemplosAdmin(templos) {
    const lista = document.getElementById('templosList');
    lista.innerHTML = '';
    
    templos.forEach(templo => {
        const primeraImagen = templo.imagenes && templo.imagenes.length > 0 
            ? templo.imagenes[0] 
            : 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&h=300&fit=crop';
            
        const card = document.createElement('div');
        card.className = 'admin-templo-card';
        card.innerHTML = `
            <img src="${primeraImagen}" 
                 alt="${templo.nombre}" 
                 class="admin-card-imagen"
                 onerror="this.src='https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&h=300&fit=crop'">
            <div class="admin-card-info">
                <h3 class="admin-card-nombre">${templo.nombre}</h3>
                <p class="admin-card-direccion">
                    <i class="fas fa-map-marker-alt"></i> ${templo.direccion || 'Sin dirección'}
                </p>
                <div class="admin-card-actions">
                    <button class="btn-editar" data-id="${templo.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-eliminar" data-id="${templo.id}" data-nombre="${templo.nombre}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
        
        // Event listeners para botones - CORREGIDO
        const btnEditar = card.querySelector('.btn-editar');
        const btnEliminar = card.querySelector('.btn-eliminar');
        
        if (btnEditar) {
            btnEditar.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                editartemplo(templo.id);
            });
        }
        
        if (btnEliminar) {
            btnEliminar.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                confirmarEliminar(templo.id, templo.nombre);
            });
        }
        
        lista.appendChild(card);
    });
}

// Mostrar formulario
function mostrarFormulario() {
    editandoId = null;
    imagenesActuales = [];
    document.getElementById('formTitle').textContent = 'Nueva templo';
    document.getElementById('temploForm').reset();
    document.getElementById('temploId').value = '';
    document.getElementById('imagenesGrid').innerHTML = '';
    document.getElementById('latitud').value = '';
    document.getElementById('longitud').value = '';
    document.getElementById('ubicacionStatus').textContent = '';
    document.getElementById('ubicacionStatus').className = 'ubicacion-status';
    
    // Resetear tipo de imagen
    document.getElementById('tipoImagen').value = 'upload';
    document.getElementById('imagenUpload').style.display = 'block';
    document.getElementById('imagenUrl').style.display = 'none';
    
    // Limpiar avisos y dejar solo uno
    const avisosContainer = document.getElementById('avisosContainer');
    avisosContainer.innerHTML = `
        <div class="aviso-input-group">
            <input type="text" class="aviso-input" placeholder="Escribe un aviso...">
            <button type="button" class="btn-remove-aviso">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Resetear horarios
    resetearHorarios();
    
    document.getElementById('formulariotemplo').style.display = 'block';
    document.getElementById('formulariotemplo').scrollIntoView({ behavior: 'smooth' });
}

// Resetear horarios a uno por día
function resetearHorarios() {
    const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    
    dias.forEach(dia => {
        const container = document.getElementById(`horarios${dia}`);
        if (container) {
            container.innerHTML = `
                <div class="horario-item-input">
                    <input type="text" placeholder="Ej: 7:00 AM" value="">
                    <button type="button" class="btn-remove-horario">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
    });
}

// Cerrar formulario
function cerrarFormulario() {
    document.getElementById('formulariotemplo').style.display = 'none';
    editandoId = null;
    imagenesActuales = [];
}

// Agregar aviso
function agregarAviso() {
    const container = document.getElementById('avisosContainer');
    const nuevoAviso = document.createElement('div');
    nuevoAviso.className = 'aviso-input-group';
    nuevoAviso.innerHTML = `
        <input type="text" class="aviso-input" placeholder="Escribe un aviso...">
        <button type="button" class="btn-remove-aviso">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(nuevoAviso);
}

// Remover aviso
function removerAviso(button) {
    const container = document.getElementById('avisosContainer');
    if (container.children.length > 1) {
        button.closest('.aviso-input-group').remove();
    } else {
        alert('Debe haber al menos un campo de aviso');
    }
}

// Agregar horario a un día específico
function agregarHorario(dia) {
    const container = document.getElementById(`horarios${dia}`);
    const nuevoHorario = document.createElement('div');
    nuevoHorario.className = 'horario-item-input';
    nuevoHorario.innerHTML = `
        <input type="text" placeholder="Ej: 7:00 PM">
        <button type="button" class="btn-remove-horario">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(nuevoHorario);
}

// Remover horario
function removerHorario(button) {
    const container = button.closest('.horarios-list');
    if (container.children.length > 1) {
        button.closest('.horario-item-input').remove();
    } else {
        alert('Debe haber al menos un campo de horario por día');
    }
}

// Agregar imagen
async function agregarImagen() {
    const tipoImagen = document.getElementById('tipoImagen').value;
    const imagenUpload = document.getElementById('imagenUpload');
    const imagenUrlInput = document.getElementById('imagenUrl');
    
    if (tipoImagen === 'upload') {
        if (!imagenUpload.files || !imagenUpload.files[0]) {
            alert('Por favor selecciona una imagen');
            return;
        }
        
        const file = imagenUpload.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagenesActuales.push({
                tipo: 'upload',
                file: file,
                preview: e.target.result
            });
            renderImagenesGrid();
            imagenUpload.value = '';
        };
        
        reader.readAsDataURL(file);
    } else {
        const url = imagenUrlInput.value.trim();
        if (!url) {
            alert('Por favor ingresa una URL válida');
            return;
        }
        
        imagenesActuales.push({
            tipo: 'url',
            url: url,
            preview: url
        });
        renderImagenesGrid();
        imagenUrlInput.value = '';
    }
}

// Renderizar grid de imágenes
function renderImagenesGrid() {
    const grid = document.getElementById('imagenesGrid');
    grid.innerHTML = '';
    
    imagenesActuales.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'imagen-item';
        div.innerHTML = `
            <img src="${img.preview}" alt="Imagen ${index + 1}">
            <button type="button" class="btn-remove-imagen" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        grid.appendChild(div);
    });
}

// Remover imagen del grid
function removerImagen(index) {
    if (confirm('¿Eliminar esta imagen?')) {
        imagenesActuales.splice(index, 1);
        renderImagenesGrid();
    }
}

// Obtener ubicación actual
async function obtenerUbicacionActual() {
    const btn = document.getElementById('btnUbicacionAuto');
    const status = document.getElementById('ubicacionStatus');
    
    if (!navigator.geolocation) {
        status.textContent = 'La geolocalización no es soportada por este navegador';
        status.className = 'ubicacion-status ubicacion-error';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detectando...';
    status.textContent = 'Obteniendo ubicación...';
    status.className = 'ubicacion-status ubicacion-loading';

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        document.getElementById('latitud').value = lat;
        document.getElementById('longitud').value = lng;
        
        const direccion = await obtenerDireccionDesdeCoordenadas(lat, lng);
        
        if (direccion) {
            document.getElementById('direccion').value = direccion;
            status.textContent = '✓ Ubicación detectada correctamente';
            status.className = 'ubicacion-status ubicacion-success';
        } else {
            status.textContent = '✓ Ubicación guardada (pero no se pudo obtener la dirección)';
            status.className = 'ubicacion-status ubicacion-success';
        }
        
    } catch (error) {
        console.error('Error obteniendo ubicación:', error);
        let mensajeError = 'Error al obtener la ubicación';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                mensajeError = 'Permiso de ubicación denegado. Por favor habilita la ubicación en tu navegador.';
                break;
            case error.POSITION_UNAVAILABLE:
                mensajeError = 'Información de ubicación no disponible.';
                break;
            case error.TIMEOUT:
                mensajeError = 'Tiempo de espera agotado para obtener la ubicación.';
                break;
        }
        
        status.textContent = mensajeError;
        status.className = 'ubicacion-status ubicacion-error';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-location-arrow"></i> Usar mi ubicación actual';
    }
}

// Obtener dirección física desde coordenadas
async function obtenerDireccionDesdeCoordenadas(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        
        if (data && data.address) {
            const address = data.address;
            let direccion = '';
            
            if (address.road) direccion += address.road;
            if (address.house_number) direccion += ` ${address.house_number}`;
            if (address.neighbourhood) direccion += `, ${address.neighbourhood}`;
            if (address.suburb && !address.neighbourhood) direccion += `, ${address.suburb}`;
            if (address.city || address.town || address.village) {
                direccion += `, ${address.city || address.town || address.village}`;
            }
            
            return direccion || `${lat}, ${lng}`;
        }
    } catch (error) {
        console.error('Error obteniendo dirección:', error);
    }
    
    return `${lat}, ${lng}`;
}

// Guardar templo
async function guardartemplo() {
    const btnGuardar = document.querySelector('.btn-guardar');
    const originalHTML = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        const nombre = document.getElementById('nombre').value;
        const direccion = document.getElementById('direccion').value;
        const descripcion = document.getElementById('descripcion').value;
        const latitud = document.getElementById('latitud').value;
        const longitud = document.getElementById('longitud').value;
        
        // Procesar imágenes
        const imagenesUrls = [];
        
        for (const img of imagenesActuales) {
            if (img.tipo === 'upload' && img.file) {
                // Subir a Firebase Storage
                const user = auth.currentUser;
                if (!user) {
                    throw new Error('Usuario no autenticado');
                }
                
                const imageRef = storageRef(storage, `templos/${Date.now()}_${img.file.name}`);
                const snapshot = await uploadBytes(imageRef, img.file);
                const url = await getDownloadURL(snapshot.ref);
                imagenesUrls.push(url);
            } else if (img.tipo === 'url') {
                // Agregar URL directamente
                imagenesUrls.push(img.url);
            } else if (img.url) {
                // Imagen existente (al editar)
                imagenesUrls.push(img.url);
            }
        }
        
      // Recopilar horarios (ahora múltiples por día) - CORREGIDO
const horarios = {};
const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

dias.forEach(dia => {
    const container = document.getElementById(`horarios${dia}`);
    const inputs = container.querySelectorAll('input[type="text"]');
    const horariosDelDia = [];
    
    inputs.forEach(input => {
        const valor = input.value.trim();
        if (valor) {
            horariosDelDia.push(valor);
        }
    });
    
    // Solo agregar el día si tiene horarios
    if (horariosDelDia.length > 0) {
        horarios[dia] = horariosDelDia;
    }
});
        
        // Recopilar avisos
        const avisosInputs = document.querySelectorAll('.aviso-input');
        const avisos = Array.from(avisosInputs)
            .map(input => input.value.trim())
            .filter(aviso => aviso !== '');
        
        const temploData = {
            nombre,
            direccion,
            descripcion,
            imagenes: imagenesUrls,
            horarios,
            avisos,
            ubicacion: {
                tieneUbicacion: !!latitud,
                latitud: latitud || null,
                longitud: longitud || null,
                googleMapsUrl: latitud ? 
                    `https://www.google.com/maps?q=${latitud},${longitud}` : 
                    null
            },
            fechaActualizacion: new Date().toISOString()
        };
        
        if (editandoId) {
            // Actualizar templo existente
            const temploRef = ref(database, `templos/${editandoId}`);
            await update(temploRef, temploData);
            alert('Templo actualizada exitosamente');
        } else {
            // Crear nueva templo
            const templosRef = ref(database, 'templos');
            await push(templosRef, temploData);
            alert('Templo agregada exitosamente');
        }
        
        cerrarFormulario();
        
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar la Templo: ' + error.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = originalHTML;
    }
}

// Editar templo
function editartemplo(id) {
    const templo = templosData.find(p => p.id === id);
    if (!templo) return;
    
    editandoId = id;
    imagenesActuales = [];
    
    document.getElementById('formTitle').textContent = 'Editar Templo';
    document.getElementById('temploId').value = id;
    document.getElementById('nombre').value = templo.nombre || '';
    document.getElementById('direccion').value = templo.direccion || '';
    document.getElementById('descripcion').value = templo.descripcion || '';
    
    // Cargar coordenadas si existen
    if (templo.ubicacion) {
        document.getElementById('latitud').value = templo.ubicacion.latitud || '';
        document.getElementById('longitud').value = templo.ubicacion.longitud || '';
    } else {
        document.getElementById('latitud').value = '';
        document.getElementById('longitud').value = '';
    }
    
    // Limpiar status de ubicación
    document.getElementById('ubicacionStatus').textContent = '';
    document.getElementById('ubicacionStatus').className = 'ubicacion-status';
    
    // Cargar imágenes existentes
    if (templo.imagenes && Array.isArray(templo.imagenes)) {
        templo.imagenes.forEach(url => {
            imagenesActuales.push({
                tipo: 'url',
                url: url,
                preview: url
            });
        });
        renderImagenesGrid();
    }
    
    // Cargar horarios - CORREGIDO: Manejar diferentes formatos de datos
    const horarios = templo.horarios || {};
    const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    
    dias.forEach(dia => {
        const container = document.getElementById(`horarios${dia}`);
        container.innerHTML = '';
        
        let horariosDelDia = horarios[dia];
        
        // Asegurarse de que horariosDelDia sea un array
        if (!horariosDelDia) {
            horariosDelDia = [''];
        } else if (typeof horariosDelDia === 'string') {
            // Si es un string, convertirlo a array
            horariosDelDia = [horariosDelDia];
        } else if (!Array.isArray(horariosDelDia)) {
            // Si no es array ni string, crear array vacío
            horariosDelDia = [''];
        }
        
        // Si el array está vacío, agregar un campo vacío
        if (horariosDelDia.length === 0) {
            horariosDelDia = [''];
        }
        
        horariosDelDia.forEach((horario, index) => {
            const div = document.createElement('div');
            div.className = 'horario-item-input';
            div.innerHTML = `
                <input type="text" value="${horario}" placeholder="Ej: 7:00 AM">
                <button type="button" class="btn-remove-horario">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(div);
        });
    });
    
    // Cargar avisos
    const avisosContainer = document.getElementById('avisosContainer');
    avisosContainer.innerHTML = '';
    const avisos = templo.avisos || [''];
    
    // Asegurarse de que avisos sea un array
    const avisosArray = Array.isArray(avisos) ? avisos : [avisos || ''];
    
    avisosArray.forEach(aviso => {
        const avisoDiv = document.createElement('div');
        avisoDiv.className = 'aviso-input-group';
        avisoDiv.innerHTML = `
            <input type="text" class="aviso-input" placeholder="Escribe un aviso..." value="${aviso}">
            <button type="button" class="btn-remove-aviso">
                <i class="fas fa-trash"></i>
            </button>
        `;
        avisosContainer.appendChild(avisoDiv);
    });
    
    document.getElementById('formulariotemplo').style.display = 'block';
    document.getElementById('formulariotemplo').scrollIntoView({ behavior: 'smooth' });
}

// Confirmar eliminar
function confirmarEliminar(id, nombre) {
    if (confirm(`¿Estás seguro de eliminar el Templo "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        eliminartemplo(id);
    }
}

// Eliminar templo
async function eliminartemplo(id) {
    try {
        const temploRef = ref(database, `templos/${id}`);
        await remove(temploRef);
        alert('Templo eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la Templo: ' + error.message);
    }
}
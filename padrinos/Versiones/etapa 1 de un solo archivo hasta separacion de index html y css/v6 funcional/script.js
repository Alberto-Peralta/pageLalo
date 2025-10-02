// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
    authDomain: "pagelalo-1b210.firebaseapp.com",
    databaseURL: "https://pagelalo-1b210-default-rtdb.firebaseio.com",
    projectId: "pagelalo-1b210",
    storageBucket: "pagelalo-1b210.firebasestorage.app",
    messagingSenderId: "1096735980204",
    appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginText = document.getElementById('loginText');
const loginSpinner = document.getElementById('loginSpinner');
const loginError = document.getElementById('loginError');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const sponsorList = document.getElementById('sponsorList');
const emptyState = document.getElementById('emptyState');
const noResultsState = document.getElementById('noResultsState');
const addSponsorBtn = document.getElementById('addSponsorBtn');
const addFirstSponsorBtn = document.getElementById('addFirstSponsorBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sectorFilter = document.getElementById('sectorFilter');
const tagFilter = document.getElementById('tagFilter');
const sponsorModal = document.getElementById('sponsorModal');
const modalTitle = document.getElementById('modalTitle');
const sponsorForm = document.getElementById('sponsorForm');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveSponsorBtn = document.getElementById('saveSponsorBtn');
const saveText = document.getElementById('saveText');
const saveSpinner = document.getElementById('saveSpinner');
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const totalSponsors = document.getElementById('totalSponsors');
const visitedSponsors = document.getElementById('visitedSponsors');
const pendingSponsors = document.getElementById('pendingSponsors');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');
const qrModal = document.getElementById('qrModal');
const qrcodeContainer = document.getElementById('qrcode');
const closeQrModalBtn = document.getElementById('closeQrModalBtn');
const qrViewScreen = document.getElementById('qrViewScreen');
const qrViewTitle = document.getElementById('qrViewTitle');
const qrViewDireccion = document.getElementById('qrViewDireccion');
const qrViewTelefono = document.getElementById('qrViewTelefono');
const qrViewSector = document.getElementById('qrViewSector');
const qrViewNotas = document.getElementById('qrViewNotas');
const markVisitedBtn = document.getElementById('markVisitedBtn');
const visitedText = document.getElementById('visitedText');
const visitedSpinner = document.getElementById('visitedSpinner');
const qrViewStatus = document.getElementById('qrViewStatus');
const deletePassword = document.getElementById('deletePassword');
const deleteError = document.getElementById('deleteError');
const deleteText = document.getElementById('deleteText');
const deleteSpinner = document.getElementById('deleteSpinner');

// New Cycle Modal elements
const newCycleBtn = document.getElementById('newCycleBtn');
const newCycleModal = document.getElementById('newCycleModal');
const confirmNewCycleBtn = document.getElementById('confirmNewCycleBtn');
const cancelNewCycleBtn = document.getElementById('cancelNewCycleBtn');
const newCycleText = document.getElementById('newCycleText');
const newCycleSpinner = document.getElementById('newCycleSpinner');

// New elements for enhanced functionality
const getLocationBtn = document.getElementById('getLocationBtn');

// State variables
let editMode = false;
let currentSponsorId = null;
let userId = null;
let sponsorToDeleteId = null;
let sponsors = [];
let filteredSponsors = [];
let sectors = new Set();
let tags = new Set();

// Utility Functions
const showToast = (message, type = 'success') => {
    toast.className = `toast ${type} show`;
    toastIcon.className = type === 'success' ? 'fas fa-check-circle mr-2' : 'fas fa-exclamation-circle mr-2';
    toastMessage.textContent = message;
    setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
};

// Success Animation Function
const showSuccessAnimation = () => {
    const successOverlay = document.getElementById('successOverlay');
    successOverlay.classList.add('show');
    
    // Auto hide after 1.5 seconds
    setTimeout(() => {
        successOverlay.classList.remove('show');
    }, 1500);
};

// Pending Animation Function
const showPendingAnimation = () => {
    const pendingOverlay = document.getElementById('pendingOverlay');
    pendingOverlay.classList.add('show');
    
    // Auto hide after 1.5 seconds
    setTimeout(() => {
        pendingOverlay.classList.remove('show');
    }, 1500);
};

// Updated Animation Function
const showUpdatedAnimation = () => {
    const updatedOverlay = document.getElementById('updatedOverlay');
    updatedOverlay.classList.add('show');
    
    // Auto hide after 1.5 seconds
    setTimeout(() => {
        updatedOverlay.classList.remove('show');
    }, 1500);
};

// Function to clear all filters
const clearAllFilters = () => {
    searchInput.value = '';
    statusFilter.value = 'all';
    sectorFilter.value = 'all';
    tagFilter.value = 'all';
    filterSponsors();
};

// Function to validate password with Firebase Auth
const validatePassword = async (password) => {
    try {
        const user = auth.currentUser;
        if (!user) return false;
        
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
        await user.reauthenticateWithCredential(credential);
        return true;
    } catch (error) {
        console.log('Password validation failed:', error.code);
        return false;
    }
};

// Phone and WhatsApp functionality
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `52${cleaned}`;
    }
    return cleaned;
};

const makeCall = (phone) => {
    const formatted = formatPhoneNumber(phone);
    if (formatted) {
        window.open(`tel:+${formatted}`, '_self');
    }
};

const sendWhatsApp = (phone, name) => {
    const formatted = formatPhoneNumber(phone);
    if (formatted) {
        const message = encodeURIComponent(`Hola ${name || 'Padrino'}, espero se encuentre bien.`);
        window.open(`https://wa.me/${formatted}?text=${message}`, '_blank');
    }
};

const showPhoneActions = (phone, name, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!phone) return;

    // Remove any existing menu
    const existingMenu = document.querySelector('.phone-action-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }

    const actionMenu = document.createElement('div');
    actionMenu.className = 'phone-action-menu fixed bg-white shadow-xl rounded-xl p-3 z-50 border border-gray-200';
    
    // Position the menu
    const rect = event.target.getBoundingClientRect();
    actionMenu.style.left = Math.max(10, rect.left - 100) + 'px';
    actionMenu.style.top = (rect.bottom + 10) + 'px';
    
    actionMenu.innerHTML = `
        <div class="text-xs text-gray-500 mb-2 font-medium">${phone}</div>
        <button class="flex items-center w-full text-left px-3 py-3 hover:bg-green-50 rounded-lg transition-colors duration-200" onclick="makeCall('${phone}')">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-phone text-green-600 text-sm"></i>
            </div>
            <span class="font-medium text-gray-800">Llamar</span>
        </button>
        <button class="flex items-center w-full text-left px-3 py-3 hover:bg-green-50 rounded-lg transition-colors duration-200" onclick="sendWhatsApp('${phone}', '${name}')">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <i class="fab fa-whatsapp text-green-600 text-sm"></i>
            </div>
            <span class="font-medium text-gray-800">WhatsApp</span>
        </button>
    `;
    
    document.body.appendChild(actionMenu);
    
    // Close menu when clicking elsewhere
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!actionMenu.contains(e.target)) {
                if (document.body.contains(actionMenu)) {
                    document.body.removeChild(actionMenu);
                }
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 100);
};

// Google Maps integration
const openGoogleMaps = (address, coordinates) => {
    let url = 'https://www.google.com/maps/search/';
    if (coordinates && coordinates.includes(',')) {
        const [lat, lng] = coordinates.split(',').map(coord => coord.trim());
        if (lat && lng) {
            url += `${lat},${lng}`;
        } else if (address) {
            url += encodeURIComponent(address);
        }
    } else if (address) {
        url += encodeURIComponent(address);
    }
    window.open(url, '_blank');
};

// Get current location
const getCurrentLocation = () => {
    if (!navigator.geolocation) {
        showToast('Geolocalización no disponible en este navegador', 'error');
        return;
    }

    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            document.getElementById('coordenadas').value = `${lat}, ${lng}`;
            showToast('Ubicación obtenida correctamente');
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
        },
        (error) => {
            showToast('Error al obtener ubicación: ' + error.message, 'error');
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
        }
    );
};

// Admin Functions
const checkAdminStatus = async (userId) => {
    try {
        return new Promise((resolve) => {
            database.ref('admins').once('value', (snapshot) => {
                const admins = snapshot.val();
                const isAdmin = admins && admins[userId] === true;
                console.log('Admin check result:', isAdmin);
                resolve(isAdmin);
            }, (error) => {
                console.error("Error checking admin status:", error);
                showToast('Error al verificar permisos', 'error');
                resolve(false);
            });
        });
    } catch (error) {
        console.error("Error checking admin status:", error);
        showToast('Error al verificar permisos de administrador', 'error');
        return false;
    }
};

// Date formatting
const formatVisitDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return `Visitado el ${date.toLocaleDateString('es-ES', options)}`;
};

// QR Code Functions
const createQrUrl = (sponsorId) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?mode=qr&id=${sponsorId}&uid=${userId}`;
};

const renderQrModal = (sponsorId) => {
    const qrUrl = createQrUrl(sponsorId);
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, { text: qrUrl, width: 256, height: 256 });
    qrModal.classList.remove('hidden');
};

const renderQrView = async (sponsorId) => {
    const userRef = database.ref(`users/${userId}/padrinos/${sponsorId}`);
    const snapshot = await userRef.once('value');
    if (!snapshot.exists()) {
        mainApp.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        showToast('QR inválido o padrino no encontrado', 'error');
        return;
    }
    const sponsor = snapshot.val();
    qrViewScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    loginScreen.classList.add('hidden');
    qrViewTitle.textContent = `${sponsor.tratamiento || ''} ${sponsor.nombre || 'Padrino'}`.trim();
    qrViewDireccion.textContent = sponsor.direccion || 'No especificado';
    qrViewTelefono.textContent = sponsor.telefono || 'No especificado';
    qrViewSector.textContent = sponsor.sector || 'No especificado';
    qrViewNotas.textContent = sponsor.notas || 'No hay notas.';
    if (sponsor.visitadoEn) {
        qrViewStatus.textContent = `Estado: Visitado`;
        markVisitedBtn.classList.add('hidden');
    } else {
        qrViewStatus.textContent = `Estado: Pendiente`;
        markVisitedBtn.classList.remove('hidden');
    }
    markVisitedBtn.onclick = async () => {
        visitedText.textContent = 'Actualizando...';
        visitedSpinner.classList.remove('hidden');
        markVisitedBtn.disabled = true;
        try {
            await userRef.update({ visitadoEn: Date.now() });
            showToast('Padrino marcado como visitado', 'success');
            qrViewStatus.textContent = `Estado: Visitado`;
            markVisitedBtn.classList.add('hidden');
        } catch (e) {
            showToast('Error al actualizar el estado', 'error');
        } finally {
            visitedText.textContent = 'Marcar como Visitado';
            visitedSpinner.classList.add('hidden');
            markVisitedBtn.disabled = false;
        }
    };
};

// Card Creation and Rendering
const createMainSponsorCard = (sponsor) => {
    const isVisited = !!sponsor.visitadoEn;
    const visitDateText = isVisited ? formatVisitDate(sponsor.visitadoEn) : '';
    const fullName = `${sponsor.tratamiento || ''} ${sponsor.nombre || 'Sin nombre'}`.trim();
    const formattedImporte = sponsor.importe ? `${Number(sponsor.importe).toFixed(2)}` : '';
    const customTag = sponsor.etiqueta && sponsor.etiqueta.trim() ? `<span class="tag">${sponsor.etiqueta}</span>` : '';
    
    // Status badge
    const statusBadge = isVisited ? 
        '<span class="status-badge visited"><i class="fas fa-check mr-1"></i>Visitado</span>' : 
        '<span class="status-badge pending"><i class="fas fa-clock mr-1"></i>Pendiente</span>';
    
    const cardClasses = `bg-white rounded-2xl shadow-md p-5 card-hover sponsor-card ${isVisited ? 'visited' : 'pending'}`;
    
    const notesSection = sponsor.notas && sponsor.notas.trim() ? `
        <div class="notes-section">
            <div class="flex items-start">
                <i class="fas fa-sticky-note mr-2 text-yellow-600 mt-1"></i>
                <div class="flex-1">
                    <p class="text-sm text-gray-700 font-medium">Notas:</p>
                    <p class="text-sm text-gray-600 mt-1">${sponsor.notas}</p>
                </div>
            </div>
        </div>
    ` : '';

    return `
        <div class="${cardClasses}">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-lg font-bold text-gray-800">${fullName}</h3>
                        <label class="custom-checkbox ml-2">
                            <input type="checkbox" data-id="${sponsor.id}" class="toggle-visited-btn" ${isVisited ? 'checked' : ''}>
                        </label>
                    </div>
                    <div class="flex items-center justify-between">
                        ${sponsor.numpad ? `<p class="text-xs text-gray-500">No. Padrino: ${sponsor.numpad}</p>` : '<div></div>'}
                        <div class="flex items-center space-x-2">
                            ${customTag}
                            ${statusBadge}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="space-y-2 mb-4 border-t pt-3">
                ${sponsor.direccion ? `
                    <div class="flex items-start text-gray-600">
                        <i class="fas fa-map-marker-alt mr-3 mt-1 w-4 text-center"></i>
                        <span class="text-sm address-clickable flex-1" onclick="openGoogleMaps('${sponsor.direccion}', '${sponsor.coordenadas || ''}')">${sponsor.direccion}</span>
                        ${sponsor.coordenadas ? '<i class="fas fa-globe text-green-500 ml-2" title="Tiene coordenadas GPS"></i>' : ''}
                    </div>
                ` : ''}
                ${sponsor.telefono ? `
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-phone mr-3 w-4 text-center"></i>
                        <span class="text-sm phone-clickable flex-1" onclick="showPhoneActions('${sponsor.telefono}', '${fullName}', event)">${sponsor.telefono}</span>
                        <div class="ml-2">
                            <i class="fas fa-phone-volume text-blue-500 cursor-pointer hover:text-blue-600 text-lg" onclick="showPhoneActions('${sponsor.telefono}', '${fullName}', event)" title="Opciones de contacto"></i>
                        </div>
                    </div>
                ` : ''}
                ${sponsor.sector ? `<div class="flex items-center text-gray-600"><i class="fas fa-tag mr-3 w-4 text-center"></i><span class="text-sm">${sponsor.sector}</span></div>` : ''}
            </div>
            
            ${notesSection}
            
            ${visitDateText ? `<div class="text-xs text-gray-500 mb-2">${visitDateText}</div>` : ''}

            <div class="flex justify-between items-center border-t pt-3">
                <span class="text-lg font-bold text-blue-600">${formattedImporte}</span>
                <div class="flex items-center space-x-3">
                    <button class="qr-btn text-purple-500 hover:text-purple-700" data-id="${sponsor.id}"><i class="fas fa-qrcode fa-lg"></i></button>
                    <button class="edit-btn text-blue-500 hover:text-blue-700" data-id="${sponsor.id}"><i class="fas fa-edit fa-lg"></i></button>
                    <button class="delete-btn text-red-500 hover:text-red-700" data-id="${sponsor.id}"><i class="fas fa-trash-alt fa-lg"></i></button>
                </div>
            </div>
        </div>
    `;
};

// Filter and List Management
const updateSectorsList = () => {
    sectors.clear();
    sponsors.forEach(sponsor => {
        if (sponsor.sector) sectors.add(sponsor.sector);
    });
    sectorFilter.innerHTML = '<option value="all">Todos los sectores</option>';
    [...sectors].sort().forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        sectorFilter.appendChild(option);
    });
};

const updateTagsList = () => {
    tags.clear();
    sponsors.forEach(sponsor => {
        if (sponsor.etiqueta && sponsor.etiqueta.trim()) tags.add(sponsor.etiqueta.trim());
    });
    tagFilter.innerHTML = '<option value="all">Todas las etiquetas</option>';
    [...tags].sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
};

const filterSponsors = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const sectorValue = sectorFilter.value;
    const tagValue = tagFilter.value;
    
    filteredSponsors = sponsors.filter(sponsor => {
        const matchesSearch = searchTerm === '' || 
                            (sponsor.nombre && sponsor.nombre.toLowerCase().includes(searchTerm)) || 
                            (sponsor.numpad && sponsor.numpad.toLowerCase().includes(searchTerm)) ||
                            (sponsor.direccion && sponsor.direccion.toLowerCase().includes(searchTerm));
        const matchesStatus = statusValue === 'all' || (statusValue === 'visited' && sponsor.visitadoEn) || (statusValue === 'pending' && !sponsor.visitadoEn);
        const matchesSector = sectorValue === 'all' || (sponsor.sector && sponsor.sector === sectorValue);
        const matchesTag = tagValue === 'all' || (sponsor.etiqueta && sponsor.etiqueta === tagValue);
        return matchesSearch && matchesStatus && matchesSector && matchesTag;
    });
    renderMainList(filteredSponsors);
};

const renderMainList = (sponsorsData) => {
    console.log('Rendering list with', sponsorsData.length, 'sponsors');
    totalSponsors.textContent = sponsors.length;
    const visitedCount = sponsors.filter(s => s.visitadoEn).length;
    visitedSponsors.textContent = visitedCount;
    pendingSponsors.textContent = sponsors.length - visitedCount;
    
    // Hide all states first
    sponsorList.classList.add('hidden');
    emptyState.classList.add('hidden');
    noResultsState.classList.add('hidden');
    
    // If there are no sponsors at all (empty database)
    if (sponsors.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    // If there are sponsors but none match the filters
    if (sponsorsData.length === 0) {
        noResultsState.classList.remove('hidden');
        return;
    }
    
    // Show the sponsor list with results
    sponsorList.classList.remove('hidden');
    sponsorsData.sort((a, b) => {
        const aVisited = !!a.visitadoEn;
        const bVisited = !!b.visitadoEn;
        if (aVisited && !bVisited) return 1;
        if (!aVisited && bVisited) return -1;
        return (a.nombre || '').localeCompare(b.nombre || '');
    });
    sponsorList.innerHTML = sponsorsData.map(sponsor => createMainSponsorCard(sponsor)).join('');
};

// Modal Functions
const openModal = (sponsor = null) => {
    sponsorModal.classList.remove('hidden');
    if (sponsor) {
        document.getElementById('numpad').value = sponsor.numpad || '';
        document.getElementById('tratamiento').value = sponsor.tratamiento || '';
        document.getElementById('nombre').value = sponsor.nombre || '';
        document.getElementById('direccion').value = sponsor.direccion || '';
        document.getElementById('telefono').value = sponsor.telefono || '';
        document.getElementById('correo').value = sponsor.correo || '';
        document.getElementById('sector').value = sponsor.sector || '';
        document.getElementById('importe').value = sponsor.importe || '';
        document.getElementById('notas').value = sponsor.notas || '';
        document.getElementById('coordenadas').value = sponsor.coordenadas || '';
        document.getElementById('etiqueta').value = sponsor.etiqueta || '';
        currentSponsorId = sponsor.id;
        editMode = true;
        modalTitle.textContent = 'Editar Padrino';
        saveText.textContent = 'Guardar Cambios';
    } else {
        sponsorForm.reset();
        currentSponsorId = null;
        editMode = false;
        modalTitle.textContent = 'Añadir Nuevo Padrino';
        saveText.textContent = 'Guardar';
    }
};

const closeModal = () => {
    sponsorModal.classList.add('hidden');
    sponsorForm.reset();
    editMode = false;
    currentSponsorId = null;
};

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    console.log('=== LOGIN DEBUG START ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    // Show loading state
    loginText.textContent = "Iniciando...";
    loginSpinner.classList.remove('hidden');
    loginError.classList.add('hidden');
    loginBtn.disabled = true;
    
    try {
        console.log('1. Attempting Firebase authentication...');
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('2. Firebase auth successful!');
        console.log('   User ID:', userCredential.user.uid);
        console.log('   User email:', userCredential.user.email);
        
        console.log('3. Checking admin status...');
        
        // Simplified admin check with more logging
        const adminSnapshot = await database.ref('admins').once('value');
        const admins = adminSnapshot.val();
        console.log('4. Admins data from database:', admins);
        
        const isAdmin = admins && admins[userCredential.user.uid] === true;
        console.log('5. Is user admin?', isAdmin);
        console.log('   Looking for UID:', userCredential.user.uid);
        
        if (!isAdmin) {
            console.log('6. User is not admin - signing out');
            await auth.signOut();
            throw new Error("No tienes permisos de administrador. Tu UID: " + userCredential.user.uid);
        }
        
        console.log('7. Login successful - user is admin!');
        showToast('Sesión iniciada correctamente');
        
    } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error object:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let msg = "Error desconocido";
        if (error.code === 'auth/user-not-found') msg = "Usuario no encontrado";
        else if (error.code === 'auth/wrong-password') msg = "Contraseña incorrecta";
        else if (error.code === 'auth/invalid-email') msg = "Correo electrónico inválido";
        else if (error.code === 'auth/user-disabled') msg = "Usuario deshabilitado";
        else if (error.code === 'auth/too-many-requests') msg = "Demasiados intentos. Intenta más tarde";
        else if (error.code === 'auth/network-request-failed') msg = "Error de conexión. Verifica tu internet";
        else if (error.message) msg = error.message;
        
        loginError.textContent = msg;
        loginError.classList.remove('hidden');
    } finally {
        console.log('=== LOGIN DEBUG END ===');
        loginText.textContent = "Iniciar Sesión";
        loginSpinner.classList.add('hidden');
        loginBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', async () => {
    try { 
        await auth.signOut(); 
        showToast('Sesión cerrada'); 
    } 
    catch (error) { showToast('Error al cerrar sesión', 'error'); }
});

addSponsorBtn.addEventListener('click', () => openModal());
addFirstSponsorBtn.addEventListener('click', () => openModal());
clearFiltersBtn.addEventListener('click', clearAllFilters);

newCycleBtn.addEventListener('click', () => {
    const visitedCount = sponsors.filter(s => s.visitadoEn).length;
    if (visitedCount === 0) {
        showToast('No hay padrinos visitados para reiniciar', 'error');
        return;
    }
    newCycleModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
closeQrModalBtn.addEventListener('click', () => qrModal.classList.add('hidden'));

// New Cycle Modal event listeners
cancelNewCycleBtn.addEventListener('click', () => {
    newCycleModal.classList.add('hidden');
});

confirmNewCycleBtn.addEventListener('click', async () => {
    newCycleText.textContent = 'Reiniciando...';
    newCycleSpinner.classList.remove('hidden');
    confirmNewCycleBtn.disabled = true;
    
    try {
        const updates = {};
        const visitedSponsorsToReset = sponsors.filter(s => s.visitadoEn);
        
        visitedSponsorsToReset.forEach(sponsor => {
            updates[`users/${userId}/padrinos/${sponsor.id}/visitadoEn`] = null;
        });
        
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            showToast(`Nuevo ciclo iniciado - ${visitedSponsorsToReset.length} padrinos reiniciados`);
        }
        
        newCycleModal.classList.add('hidden');
        
    } catch (error) {
        console.error('Error resetting cycle:', error);
        showToast('Error al iniciar nuevo ciclo', 'error');
    } finally {
        newCycleText.textContent = 'Iniciar Ciclo';
        newCycleSpinner.classList.add('hidden');
        confirmNewCycleBtn.disabled = false;
    }
});

searchInput.addEventListener('input', filterSponsors);
statusFilter.addEventListener('change', filterSponsors);
sectorFilter.addEventListener('change', filterSponsors);
tagFilter.addEventListener('change', filterSponsors);

getLocationBtn.addEventListener('click', getCurrentLocation);

sponsorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveText.textContent = "Guardando...";
    saveSpinner.classList.remove('hidden');
    saveSponsorBtn.disabled = true;
    
    const sponsorData = {
        numpad: document.getElementById('numpad').value.trim(),
        tratamiento: document.getElementById('tratamiento').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        sector: document.getElementById('sector').value.trim(),
        importe: parseFloat(document.getElementById('importe').value) || 0,
        notas: document.getElementById('notas').value.trim(),
        coordenadas: document.getElementById('coordenadas').value.trim(),
        etiqueta: document.getElementById('etiqueta').value.trim(),
    };
    
    try {
        if (editMode) {
            const updateData = {};
            updateData.numpad = sponsorData.numpad || null;
            updateData.tratamiento = sponsorData.tratamiento || null;
            updateData.nombre = sponsorData.nombre || null;
            updateData.direccion = sponsorData.direccion || null;
            updateData.telefono = sponsorData.telefono || null;
            updateData.correo = sponsorData.correo || null;
            updateData.sector = sponsorData.sector || null;
            updateData.coordenadas = sponsorData.coordenadas || null;
            updateData.etiqueta = sponsorData.etiqueta || null;
            updateData.notas = sponsorData.notas || null;
            
            if (sponsorData.importe > 0) {
                updateData.importe = sponsorData.importe;
            } else {
                updateData.importe = null;
            }
            
            await database.ref(`users/${userId}/padrinos/${currentSponsorId}`).update(updateData);
            showUpdatedAnimation(); // Show updated animation
            showToast('Padrino actualizado');
        } else {
            if (!sponsorData.numpad) delete sponsorData.numpad;
            if (!sponsorData.tratamiento) delete sponsorData.tratamiento;
            if (!sponsorData.direccion) delete sponsorData.direccion;
            if (!sponsorData.telefono) delete sponsorData.telefono;
            if (!sponsorData.correo) delete sponsorData.correo;
            if (!sponsorData.sector) delete sponsorData.sector;
            if (!sponsorData.coordenadas) delete sponsorData.coordenadas;
            if (!sponsorData.etiqueta) delete sponsorData.etiqueta;
            if (!sponsorData.notas) delete sponsorData.notas;
            if (sponsorData.importe === 0) delete sponsorData.importe;
            
            await database.ref(`users/${userId}/padrinos`).push().set({ ...sponsorData, visitadoEn: null });
            showToast('Padrino agregado');
        }
        closeModal();
    } catch (e) {
        showToast('Error al guardar', 'error');
    } finally {
        saveText.textContent = "Guardar";
        saveSpinner.classList.add('hidden');
        saveSponsorBtn.disabled = false;
    }
});

// Authentication State Change Handler
auth.onAuthStateChanged(async (user) => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'qr' && urlParams.get('id')) {
        userId = urlParams.get('uid');
        renderQrView(urlParams.get('id'));
    } else if (user) {
        userId = user.uid;
        userEmail.textContent = user.email;
        const isAdmin = await checkAdminStatus(userId);
        if (!isAdmin) {
            await auth.signOut();
            loginError.textContent = "No tienes permisos para acceder.";
            loginError.classList.remove('hidden');
            return;
        }
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        database.ref(`users/${userId}/padrinos`).on('value', (snapshot) => {
            console.log('Firebase data updated');
            const sponsorsData = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    sponsorsData.push({ id: child.key, ...child.val() });
                });
            }
            console.log('Loaded', sponsorsData.length, 'sponsors from Firebase');
            sponsors = sponsorsData;
            updateSectorsList();
            updateTagsList();
            filterSponsors();
        }, (error) => {
            console.error('Firebase error:', error);
            showToast('Error al cargar datos', 'error');
        });

        // Sponsor List Event Delegation
        sponsorList.addEventListener('click', async (e) => {
            const button = e.target.closest('button, input');
            if (!button) return;

            const id = button.dataset.id;
            if (button.matches('.toggle-visited-btn')) {
                try {
                    const ref = database.ref(`users/${userId}/padrinos/${id}`);
                    if (button.checked) {
                        await ref.update({ visitadoEn: Date.now() });
                        showSuccessAnimation(); // Show success animation
                        showToast('Marcado como visitado');
                    } else {
                        await ref.child('visitadoEn').remove();
                        showPendingAnimation(); // Show pending animation
                        showToast('Marcado como pendiente');
                    }
                } catch (e) {
                    showToast('Error al actualizar', 'error');
                    button.checked = !button.checked;
                }
            } else if (button.matches('.edit-btn')) {
                openModal(sponsors.find(s => s.id === id));
            } else if (button.matches('.delete-btn')) {
                sponsorToDeleteId = id;
                deletePassword.value = '';
                deleteError.classList.add('hidden');
                confirmModal.classList.remove('hidden');
            } else if (button.matches('.qr-btn')) {
                renderQrModal(id);
            }
        });

        // Delete confirmation handling
        cancelDeleteBtn.addEventListener('click', () => {
            confirmModal.classList.add('hidden');
            sponsorToDeleteId = null;
        });

        confirmDeleteBtn.addEventListener('click', async () => {
            const password = deletePassword.value;
            if (!password) {
                deleteError.textContent = 'Por favor ingresa tu contraseña';
                deleteError.classList.remove('hidden');
                return;
            }

            deleteText.textContent = 'Verificando...';
            deleteSpinner.classList.remove('hidden');
            confirmDeleteBtn.disabled = true;

            try {
                const isValid = await validatePassword(password);
                if (!isValid) {
                    deleteError.textContent = 'Contraseña incorrecta';
                    deleteError.classList.remove('hidden');
                    return;
                }

                await database.ref(`users/${userId}/padrinos/${sponsorToDeleteId}`).remove();
                showToast('Padrino eliminado');
                confirmModal.classList.add('hidden');
            } catch (error) {
                console.error('Error deleting sponsor:', error);
                showToast('Error al eliminar padrino', 'error');
            } finally {
                deleteText.textContent = 'Eliminar';
                deleteSpinner.classList.add('hidden');
                confirmDeleteBtn.disabled = false;
            }
        });
    } else {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

// Make functions globally accessible
window.makeCall = makeCall;
window.sendWhatsApp = sendWhatsApp;
window.showPhoneActions = showPhoneActions;
window.openGoogleMaps = openGoogleMaps;
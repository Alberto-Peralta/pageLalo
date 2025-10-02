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
const completedSponsors = document.getElementById('completedSponsors');
const pendingSponsors = document.getElementById('pendingSponsors');
const totalCollected = document.getElementById('totalCollected');
const totalPending = document.getElementById('totalPending');
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

// Visit Modal elements
const visitModal = document.getElementById('visitModal');
const closeVisitModalBtn = document.getElementById('closeVisitModalBtn');
const visitForm = document.getElementById('visitForm');
const cancelVisitBtn = document.getElementById('cancelVisitBtn');
const saveVisitBtn = document.getElementById('saveVisitBtn');
const saveVisitText = document.getElementById('saveVisitText');
const saveVisitSpinner = document.getElementById('saveVisitSpinner');
const amountSection = document.getElementById('amountSection');
const contributionAmount = document.getElementById('contributionAmount');
const visitNotes = document.getElementById('visitNotes');

// History Modal elements
const historyModal = document.getElementById('historyModal');
const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
const historyContent = document.getElementById('historyContent');

// Reports Modal elements
const reportsBtn = document.getElementById('reportsBtn');
const reportsModal = document.getElementById('reportsModal');
const closeReportsModalBtn = document.getElementById('closeReportsModalBtn');
const reportsContent = document.getElementById('reportsContent');

// Enhanced functionality elements
const getLocationBtn = document.getElementById('getLocationBtn');

// State variables
let editMode = false;
let currentSponsorId = null;
let userId = null;
let sponsorToDeleteId = null;
let currentVisitSponsorId = null;
let sponsors = [];
let filteredSponsors = [];
let sectors = new Set();
let tags = new Set();
let currentSearchTerm = '';
let currentStatusFilter = 'all';
let currentSectorFilter = 'all';
let currentTagFilter = 'all';

// Utility Functions
const showToast = (message, type = 'success') => {
    toast.className = `toast ${type} show`;
    const icons = {
        success: 'fas fa-check-circle mr-2',
        error: 'fas fa-exclamation-circle mr-2',
        warning: 'fas fa-exclamation-triangle mr-2',
        info: 'fas fa-info-circle mr-2'
    };
    toastIcon.className = icons[type] || icons.info;
    toastMessage.textContent = message;
    setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
};

// Success Animation Function
const showSuccessAnimation = () => {
    const successOverlay = document.getElementById('successOverlay');
    successOverlay.classList.add('show');
    setTimeout(() => {
        successOverlay.classList.remove('show');
    }, 1500);
};

// Pending Animation Function
const showPendingAnimation = () => {
    const pendingOverlay = document.getElementById('pendingOverlay');
    pendingOverlay.classList.add('show');
    setTimeout(() => {
        pendingOverlay.classList.remove('show');
    }, 1500);
};

// Updated Animation Function
const showUpdatedAnimation = () => {
    const updatedOverlay = document.getElementById('updatedOverlay');
    updatedOverlay.classList.add('show');
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
    
    currentSearchTerm = '';
    currentStatusFilter = 'all';
    currentSectorFilter = 'all';
    currentTagFilter = 'all';
    
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

    const existingMenu = document.querySelector('.phone-action-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }

    const actionMenu = document.createElement('div');
    actionMenu.className = 'phone-action-menu fixed bg-white shadow-xl rounded-xl p-3 z-50 border border-gray-200';
    
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
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return date.toLocaleDateString('es-ES', options);
};

// Visit Status Functions
const getVisitStatusInfo = (status) => {
    const statusMap = {
        completed: {
            icon: 'fas fa-check-circle',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            label: 'Completado',
            description: 'Aportó'
        },
        visited_no_contribution: {
            icon: 'fas fa-user-clock',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            label: 'Visitado',
            description: 'No aportó'
        },
        not_home: {
            icon: 'fas fa-home',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            label: 'No estaba',
            description: 'No en casa'
        },
        return_later: {
            icon: 'fas fa-clock',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            label: 'Regresar',
            description: 'Pidió que regresemos'
        }
    };
    return statusMap[status] || statusMap.visited_no_contribution;
};

const getSponsorStatus = (sponsor) => {
    if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) {
        return 'pending';
    }
    
    const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
    const lastVisit = sortedVisits[0];
    
    if (lastVisit.status === 'completed') {
        return 'completed';
    } else if (lastVisit.status === 'visited_no_contribution') {
        return 'visited';
    } else {
        return 'pending';
    }
};

// Enhanced calculation functions
const calculateTotalCollected = () => {
    return sponsors.reduce((total, sponsor) => {
        if (sponsor.visits) {
            const completedVisits = Object.values(sponsor.visits).filter(v => v.status === 'completed');
            const visitTotal = completedVisits.reduce((sum, visit) => sum + (visit.amount || 0), 0);
            return total + visitTotal;
        }
        return total;
    }, 0);
};

const calculateTotalExpected = () => {
    return sponsors.reduce((total, sponsor) => total + (sponsor.importe || 0), 0);
};

const calculateTotalPending = () => {
    const collected = calculateTotalCollected();
    const expected = calculateTotalExpected();
    return Math.max(0, expected - collected);
};

const getVisitCount = (sponsor) => {
    return sponsor.visits ? Object.keys(sponsor.visits).length : 0;
};

const getTotalContributed = (sponsor) => {
    if (!sponsor.visits) return 0;
    return Object.values(sponsor.visits)
        .filter(v => v.status === 'completed')
        .reduce((sum, visit) => sum + (visit.amount || 0), 0);
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
    
    const status = getSponsorStatus(sponsor);
    const statusInfo = getVisitStatusInfo(status);
    qrViewStatus.textContent = `Estado: ${statusInfo.label}`;
    
    if (status === 'completed') {
        markVisitedBtn.classList.add('hidden');
    } else {
        markVisitedBtn.classList.remove('hidden');
    }
    
    markVisitedBtn.onclick = () => {
        currentVisitSponsorId = sponsorId;
        visitModal.classList.remove('hidden');
    };
};

// Visit Management Functions
const openVisitModal = (sponsorId) => {
    currentVisitSponsorId = sponsorId;
    visitForm.reset();
    amountSection.classList.add('hidden');
    visitModal.classList.remove('hidden');
};

const closeVisitModal = () => {
    visitModal.classList.add('hidden');
    visitForm.reset();
    currentVisitSponsorId = null;
};

const saveVisit = async (sponsorId, visitData) => {
    const visitId = Date.now().toString();
    const visitRef = database.ref(`users/${userId}/padrinos/${sponsorId}/visits/${visitId}`);
    
    await visitRef.set({
        ...visitData,
        timestamp: Date.now()
    });
};

// History Functions
const openHistoryModal = (sponsorId) => {
    const sponsor = sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;
    
    historyContent.innerHTML = generateHistoryContent(sponsor);
    historyModal.classList.remove('hidden');
};

const generateHistoryContent = (sponsor) => {
    if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) {
        return `
            <div class="text-center py-8">
                <i class="fas fa-history text-gray-400 text-3xl mb-4"></i>
                <p class="text-gray-500">No hay visitas registradas</p>
            </div>
        `;
    }
    
    const visits = Object.entries(sponsor.visits)
        .map(([id, visit]) => ({ id, ...visit }))
        .sort((a, b) => b.timestamp - a.timestamp);
    
    const totalContributed = getTotalContributed(sponsor);
    const expectedAmount = sponsor.importe || 0;
    const progressPercentage = expectedAmount > 0 ? (totalContributed / expectedAmount) * 100 : 0;
    
    let content = `
        <div class="mb-6">
            <h3 class="text-lg font-bold mb-2">${sponsor.tratamiento || ''} ${sponsor.nombre || 'Padrino'}</h3>
            <div class="contribution-summary">
                <div class="contribution-amount">$${totalContributed.toFixed(2)} de $${expectedAmount.toFixed(2)}</div>
                <div class="contribution-progress">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                    </div>
                    <div class="contribution-percentage">${progressPercentage.toFixed(1)}% completado</div>
                </div>
            </div>
        </div>
        
        <div class="visit-history">
    `;
    
    visits.forEach(visit => {
        const statusInfo = getVisitStatusInfo(visit.status);
        const date = formatVisitDate(visit.timestamp);
        
        content += `
            <div class="visit-entry ${visit.status}">
                <div class="visit-entry-header">
                    <div class="visit-entry-status ${statusInfo.color}">
                        <i class="${statusInfo.icon} mr-2"></i>
                        ${statusInfo.label}
                    </div>
                    <div class="visit-entry-date">${date}</div>
                </div>
                ${visit.amount ? `<div class="visit-entry-amount">$${visit.amount.toFixed(2)}</div>` : ''}
                ${visit.notes ? `<div class="visit-entry-notes">"${visit.notes}"</div>` : ''}
            </div>
        `;
    });
    
    content += '</div>';
    return content;
};

// Reports Functions
const openReportsModal = () => {
    reportsContent.innerHTML = generateReportsContent();
    reportsModal.classList.remove('hidden');
};

const generateReportsContent = () => {
    const totalExpected = calculateTotalExpected();
    const totalCollected = calculateTotalCollected();
    const totalPendingAmount = calculateTotalPending();
    const completedCount = sponsors.filter(s => getSponsorStatus(s) === 'completed').length;
    const visitedCount = sponsors.filter(s => getSponsorStatus(s) === 'visited').length;
    const pendingCount = sponsors.filter(s => getSponsorStatus(s) === 'pending').length;
    
    const progressPercentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    
    // Statistics by sector
    const sectorStats = {};
    sponsors.forEach(sponsor => {
        const sector = sponsor.sector || 'Sin sector';
        if (!sectorStats[sector]) {
            sectorStats[sector] = {
                total: 0,
                completed: 0,
                collected: 0,
                expected: 0
            };
        }
        sectorStats[sector].total++;
        sectorStats[sector].expected += sponsor.importe || 0;
        
        const status = getSponsorStatus(sponsor);
        if (status === 'completed') {
            sectorStats[sector].completed++;
        }
        sectorStats[sector].collected += getTotalContributed(sponsor);
    });
    
    let content = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="report-stat">
                <div class="report-stat-value text-blue-600">${sponsors.length}</div>
                <div class="report-stat-label">Total Padrinos</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value text-green-600">${completedCount}</div>
                <div class="report-stat-label">Completados</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value text-emerald-600">$${totalCollected.toFixed(2)}</div>
                <div class="report-stat-label">Recaudado</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value text-red-600">$${totalPendingAmount.toFixed(2)}</div>
                <div class="report-stat-label">Pendiente</div>
            </div>
        </div>
        
        <div class="report-chart mb-8">
            <h3 class="text-lg font-bold mb-4">Progreso General</h3>
            <div class="contribution-summary">
                <div class="contribution-amount">$${totalCollected.toFixed(2)} de $${totalExpected.toFixed(2)}</div>
                <div class="contribution-progress">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                    </div>
                    <div class="contribution-percentage">${progressPercentage.toFixed(1)}% del objetivo</div>
                </div>
            </div>
        </div>
        
        <div class="report-chart">
            <h3 class="text-lg font-bold mb-4">Estadísticas por Sector</h3>
            <div class="space-y-4">
    `;
    
    Object.entries(sectorStats).forEach(([sector, stats]) => {
        const sectorProgress = stats.expected > 0 ? (stats.collected / stats.expected) * 100 : 0;
        content += `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-semibold">${sector}</h4>
                    <span class="text-sm text-gray-600">${stats.completed}/${stats.total} completados</span>
                </div>
                <div class="text-sm text-gray-600 mb-2">$${stats.collected.toFixed(2)} de $${stats.expected.toFixed(2)}</div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${Math.min(sectorProgress, 100)}%"></div>
                </div>
                <div class="text-xs text-gray-500 mt-1">${sectorProgress.toFixed(1)}%</div>
            </div>
        `;
    });
    
    content += '</div></div>';
    return content;
};

// Card Creation and Rendering
const createMainSponsorCard = (sponsor) => {
    const status = getSponsorStatus(sponsor);
    const statusInfo = getVisitStatusInfo(status);
    const fullName = `${sponsor.tratamiento || ''} ${sponsor.nombre || 'Sin nombre'}`.trim();
    const formattedImporte = sponsor.importe ? `$${Number(sponsor.importe).toFixed(2)}` : '';
    const customTag = sponsor.etiqueta && sponsor.etiqueta.trim() ? `<span class="tag">${sponsor.etiqueta}</span>` : '';
    
    const visitCount = getVisitCount(sponsor);
    const totalContributed = getTotalContributed(sponsor);
    const expectedAmount = sponsor.importe || 0;
    const progressPercentage = expectedAmount > 0 ? (totalContributed / expectedAmount) * 100 : 0;
    
    const statusBadge = `<span class="status-badge ${status}"><i class="${statusInfo.icon} mr-1"></i>${statusInfo.label}</span>`;
    
    const cardClasses = `bg-white rounded-2xl shadow-md p-5 card-hover sponsor-card ${status}`;
    
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

    const contributionSection = visitCount > 0 ? `
        <div class="border-t pt-3 mb-3">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">Progreso:</span>
                <span class="text-sm font-semibold text-emerald-600">$${totalContributed.toFixed(2)} de ${formattedImporte}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${Math.min(progressPercentage, 100)}%"></div>
            </div>
            <div class="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>${visitCount} visita${visitCount !== 1 ? 's' : ''}</span>
                <span>${progressPercentage.toFixed(1)}%</span>
            </div>
        </div>
    ` : '';

    return `
        <div class="${cardClasses}">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-lg font-bold text-gray-800">${fullName}</h3>
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
            ${contributionSection}

            <div class="flex justify-between items-center border-t pt-3">
                <span class="text-lg font-bold text-blue-600">${formattedImporte}</span>
                <div class="flex items-center space-x-2">
                    <button class="visit-btn text-green-500 hover:text-green-700" data-id="${sponsor.id}" title="Registrar visita"><i class="fas fa-plus-circle fa-lg"></i></button>
                    <button class="history-btn text-purple-500 hover:text-purple-700" data-id="${sponsor.id}" title="Ver historial"><i class="fas fa-history fa-lg"></i></button>
                    <button class="qr-btn text-blue-500 hover:text-blue-700" data-id="${sponsor.id}" title="Código QR"><i class="fas fa-qrcode fa-lg"></i></button>
                    <button class="edit-btn text-orange-500 hover:text-orange-700" data-id="${sponsor.id}" title="Editar"><i class="fas fa-edit fa-lg"></i></button>
                    <button class="delete-btn text-red-500 hover:text-red-700" data-id="${sponsor.id}" title="Eliminar"><i class="fas fa-trash-alt fa-lg"></i></button>
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
    
    currentSearchTerm = searchTerm;
    currentStatusFilter = statusValue;
    currentSectorFilter = sectorValue;
    currentTagFilter = tagValue;
    
    filteredSponsors = sponsors.filter(sponsor => {
        const matchesSearch = searchTerm === '' || 
                            (sponsor.nombre && sponsor.nombre.toLowerCase().includes(searchTerm)) || 
                            (sponsor.numpad && sponsor.numpad.toLowerCase().includes(searchTerm)) ||
                            (sponsor.direccion && sponsor.direccion.toLowerCase().includes(searchTerm));
        
        const sponsorStatus = getSponsorStatus(sponsor);
        const matchesStatus = statusValue === 'all' || 
                            (statusValue === 'completed' && sponsorStatus === 'completed') ||
                            (statusValue === 'visited' && sponsorStatus === 'visited') ||
                            (statusValue === 'pending' && sponsorStatus === 'pending');
        
        const matchesSector = sectorValue === 'all' || (sponsor.sector && sponsor.sector === sectorValue);
        const matchesTag = tagValue === 'all' || (sponsor.etiqueta && sponsor.etiqueta === tagValue);
        
        return matchesSearch && matchesStatus && matchesSector && matchesTag;
    });
    renderMainList(filteredSponsors);
};

const renderMainList = (sponsorsData) => {
    console.log('Rendering list with', sponsorsData.length, 'sponsors');
    
    // Update enhanced statistics
    const totalCount = sponsors.length;
    const completedCount = sponsors.filter(s => getSponsorStatus(s) === 'completed').length;
    const visitedCount = sponsors.filter(s => getSponsorStatus(s) === 'visited').length;
    const pendingCount = sponsors.filter(s => getSponsorStatus(s) === 'pending').length;
    const collected = calculateTotalCollected();
    const pending = calculateTotalPending();
    
    totalSponsors.textContent = totalCount;
    completedSponsors.textContent = completedCount;
    pendingSponsors.textContent = pendingCount;
    totalCollected.textContent = `${collected.toFixed(2)}`;
    totalPending.textContent = `${pending.toFixed(2)}`;
    
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
        const aStatus = getSponsorStatus(a);
        const bStatus = getSponsorStatus(b);
        
        // Sort order: pending, visited, completed
        const statusOrder = { pending: 0, visited: 1, completed: 2 };
        if (statusOrder[aStatus] !== statusOrder[bStatus]) {
            return statusOrder[aStatus] - statusOrder[bStatus];
        }
        
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

// Event Listeners Setup
const setupEventListeners = () => {
    // Login form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        
        loginText.textContent = "Iniciando...";
        loginSpinner.classList.remove('hidden');
        loginError.classList.add('hidden');
        loginBtn.disabled = true;
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const isAdmin = await checkAdminStatus(userCredential.user.uid);
            
            if (!isAdmin) {
                await auth.signOut();
                throw new Error("No tienes permisos de administrador");
            }
            
            showToast('Sesión iniciada correctamente');
            
        } catch (error) {
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
            loginText.textContent = "Iniciar Sesión";
            loginSpinner.classList.add('hidden');
            loginBtn.disabled = false;
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try { 
            await auth.signOut(); 
            showToast('Sesión cerrada'); 
        } catch (error) { 
            showToast('Error al cerrar sesión', 'error'); 
        }
    });

    // Main buttons
    addSponsorBtn.addEventListener('click', () => openModal());
    addFirstSponsorBtn.addEventListener('click', () => openModal());
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    reportsBtn.addEventListener('click', openReportsModal);

    // Filters
    searchInput.addEventListener('input', filterSponsors);
    statusFilter.addEventListener('change', filterSponsors);
    sectorFilter.addEventListener('change', filterSponsors);
    tagFilter.addEventListener('change', filterSponsors);

    // Modal closes
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    closeQrModalBtn.addEventListener('click', () => qrModal.classList.add('hidden'));
    closeVisitModalBtn.addEventListener('click', closeVisitModal);
    cancelVisitBtn.addEventListener('click', closeVisitModal);
    closeHistoryModalBtn.addEventListener('click', () => historyModal.classList.add('hidden'));
    closeReportsModalBtn.addEventListener('click', () => reportsModal.classList.add('hidden'));

    // Visit modal
    visitModal.addEventListener('change', (e) => {
        if (e.target.name === 'visitStatus') {
            if (e.target.value === 'completed') {
                amountSection.classList.remove('hidden');
            } else {
                amountSection.classList.add('hidden');
                contributionAmount.value = '';
            }
        }
    });

    visitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const visitStatus = document.querySelector('input[name="visitStatus"]:checked');
        if (!visitStatus) {
            showToast('Selecciona el estado de la visita', 'warning');
            return;
        }
        
        const visitData = {
            status: visitStatus.value,
            notes: visitNotes.value.trim(),
            amount: visitStatus.value === 'completed' ? parseFloat(contributionAmount.value) || 0 : 0
        };
        
        saveVisitText.textContent = "Guardando...";
        saveVisitSpinner.classList.remove('hidden');
        saveVisitBtn.disabled = true;
        
        try {
            await saveVisit(currentVisitSponsorId, visitData);
            showSuccessAnimation();
            showToast('Visita registrada correctamente');
            closeVisitModal();
        } catch (error) {
            console.error('Error saving visit:', error);
            showToast('Error al guardar la visita', 'error');
        } finally {
            saveVisitText.textContent = "Registrar Visita";
            saveVisitSpinner.classList.add('hidden');
            saveVisitBtn.disabled = false;
        }
    });

    // New cycle
    newCycleBtn.addEventListener('click', () => {
        const hasVisits = sponsors.some(s => s.visits && Object.keys(s.visits).length > 0);
        if (!hasVisits) {
            showToast('No hay visitas registradas para reiniciar', 'warning');
            return;
        }
        newCycleModal.classList.remove('hidden');
    });

    cancelNewCycleBtn.addEventListener('click', () => {
        newCycleModal.classList.add('hidden');
    });

    confirmNewCycleBtn.addEventListener('click', async () => {
        newCycleText.textContent = 'Reiniciando...';
        newCycleSpinner.classList.remove('hidden');
        confirmNewCycleBtn.disabled = true;
        
        try {
            const updates = {};
            
            sponsors.forEach(sponsor => {
                if (sponsor.visits) {
                    updates[`users/${userId}/padrinos/${sponsor.id}/visits`] = null;
                }
            });
            
            if (Object.keys(updates).length > 0) {
                await database.ref().update(updates);
                showToast(`Nuevo ciclo iniciado - Se reiniciaron todos los registros`);
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

    // Location
    getLocationBtn.addEventListener('click', getCurrentLocation);

    // Sponsor form
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
                Object.keys(sponsorData).forEach(key => {
                    updateData[key] = sponsorData[key] || null;
                });
                
                await database.ref(`users/${userId}/padrinos/${currentSponsorId}`).update(updateData);
                showUpdatedAnimation();
                showToast('Padrino actualizado');
            } else {
                Object.keys(sponsorData).forEach(key => {
                    if (!sponsorData[key]) delete sponsorData[key];
                });
                
                await database.ref(`users/${userId}/padrinos`).push().set(sponsorData);
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

    // Sponsor list event delegation
    sponsorList.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const id = button.dataset.id;
        if (button.matches('.visit-btn')) {
            openVisitModal(id);
        } else if (button.matches('.history-btn')) {
            openHistoryModal(id);
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

    // Delete confirmation
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
};

// Initialize event listeners
setupEventListeners();

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
        
        // Show main app
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // Listen for data changes
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
            
            // Apply saved filters if they exist
            if (currentSearchTerm !== '' || currentStatusFilter !== 'all' || 
                currentSectorFilter !== 'all' || currentTagFilter !== 'all') {
                
                searchInput.value = currentSearchTerm;
                statusFilter.value = currentStatusFilter;
                sectorFilter.value = currentSectorFilter;
                tagFilter.value = currentTagFilter;
                
                filterSponsors();
            } else {
                renderMainList(sponsors);
            }
        }, (error) => {
            console.error('Firebase error:', error);
            showToast('Error al cargar datos', 'error');
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
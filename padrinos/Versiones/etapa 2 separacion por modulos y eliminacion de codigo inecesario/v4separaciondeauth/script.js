// Get Firebase services from the global configuration
// Get Firebase services from the global configuration
const database = window.firebaseServices.database;

// Initialize main app when user is authenticated
function initializeMainApp(authenticatedUserId) {
    window.userId = authenticatedUserId;
    
    initSearchInput();
    
    database.ref(`users/${window.userId}/padrinos`).on('value', (snapshot) => {
        const sponsorsData = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                sponsorsData.push({ id: child.key, ...child.val() });
            });
        }
        sponsors = sponsorsData;
        updateSectorsList();
        updateTagsList();
        applyFiltersAndRender();
    });
}

// DOM Elements
const sponsorList = document.getElementById('sponsorList');
const emptyState = document.getElementById('emptyState');
const noResultsState = document.getElementById('noResultsState');
const addSponsorBtn = document.getElementById('addSponsorBtn');
const addFirstSponsorBtn = document.getElementById('addFirstSponsorBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
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

// Initialize dynamic search input
const initSearchInput = () => {
    const placeholder = document.getElementById('searchInputPlaceholder');
    const container = document.getElementById('searchContainer');
    
    if (placeholder && container) {
        placeholder.addEventListener('click', () => {
            // Create the real input dynamically
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'searchInput';
            input.className = 'pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300';
            input.placeholder = 'Buscar por nombre, dirección, No. Padrino...';
            
            // Important: Set these attributes to prevent autocomplete
            input.setAttribute('autocomplete', 'nope');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('spellcheck', 'false');
            
            // Replace placeholder with real input
            container.removeChild(placeholder);
            container.appendChild(input);
            
            // Focus the new input
            input.focus();
            
            // Add event listener for filtering
            input.addEventListener('input', handleSearchInput);
        });
    }
};

// State variables
let editMode = false;
let currentSponsorId = null;
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

// New Cycle Animation Function
const showNewCycleAnimation = () => {
    const newCycleOverlay = document.getElementById('newCycleOverlay');
    newCycleOverlay.classList.add('show');
    
    // Auto hide after 1.5 seconds
    setTimeout(() => {
        newCycleOverlay.classList.remove('show');
    }, 1500);
};

// Function to clear all filters
const clearAllFilters = () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    statusFilter.value = 'all';
    sectorFilter.value = 'all';
    tagFilter.value = 'all';
    
    currentSearchTerm = '';
    currentStatusFilter = 'all';
    currentSectorFilter = 'all';
    currentTagFilter = 'all';
    
    applyFiltersAndRender();
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
    let url = 'https://www.google.com/maps/search/?api=1&query=';
    if (coordinates && coordinates.includes(',')) {
        const [lat, lng] = coordinates.split(',').map(coord => coord.trim());
        if (lat && lng) {
            url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
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
        window.showToast('Geolocalización no disponible en este navegador', 'error');
        return;
    }

    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            document.getElementById('coordenadas').value = `${lat}, ${lng}`;
            window.showToast('Ubicación obtenida correctamente');
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
        },
        (error) => {
            window.showToast('Error al obtener ubicación: ' + error.message, 'error');
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
        }
    );
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
        pending: {
            icon: 'fas fa-clock',
            color: 'text-yellow-700',
            bgColor: 'bg-yellow-100',
            label: 'Pendiente',
            description: 'Visita requerida'
        },
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
    return statusMap[status] || statusMap.pending;
};

const getSponsorStatus = (sponsor) => {
    if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) {
        return 'pending';
    }

    const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
    const lastVisit = sortedVisits[0];

    // This logic determines the sponsor's current state for the cycle
    if (lastVisit.status === 'completed') {
        return 'completed';
    }

    if (lastVisit.status === 'visited_no_contribution') {
        return 'visited_no_contribution';
    }

    // Any other status ('not_home', 'return_later') means they are still pending completion
    return 'pending';
};

// Enhanced calculation functions
const calculateTotalCollected = () => {
    return sponsors.reduce((total, sponsor) => {
        // Find the last visit for the sponsor
        if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) {
            return total;
        }
        const sortedVisits = Object.values(sponsor.visits).sort((a, b) => b.timestamp - a.timestamp);
        const lastVisit = sortedVisits[0];

        // Check if the last visit's status is 'completed'
        if (lastVisit.status === 'completed') {
            // If it is, add the amount of that last visit.
            return total + (lastVisit.amount || 0);
        }

        // If the last visit is not 'completed', or there are no visits, do not add anything.
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
    // This function is used in the history modal. It should also respect the final status.
    if (getSponsorStatus(sponsor) !== 'completed') {
        return 0;
    }

    if (!sponsor.visits) return 0;
    return Object.values(sponsor.visits)
        .filter(v => v.status === 'completed')
        .reduce((sum, visit) => sum + (visit.amount || 0), 0);
};

// Visit Management Functions
const openVisitModal = (sponsorId) => {
    currentVisitSponsorId = sponsorId;
    const sponsor = sponsors.find(s => s.id === sponsorId);
    
    visitForm.reset();
    
    // Show expected amount in the completed option
    const expectedAmountDisplay = document.getElementById('expectedAmountDisplay');
    if (sponsor && sponsor.importe) {
        expectedAmountDisplay.textContent = `($${parseFloat(sponsor.importe).toFixed(2)})`;
    } else {
        expectedAmountDisplay.textContent = '';
    }
    
    visitModal.classList.remove('hidden');
};

const closeVisitModal = () => {
    visitModal.classList.add('hidden');
    visitForm.reset();
    currentVisitSponsorId = null;
};

const saveVisit = async (sponsorId, visitData) => {
    const visitId = Date.now().toString();
    const visitRef = database.ref(`users/${window.userId}/padrinos/${sponsorId}/visits/${visitId}`);
    
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
    
    // Simplemente mostramos el nombre del padrino sin la barra de progreso
    let content = `
        <div class="mb-6">
            <h3 class="text-lg font-bold mb-2">${sponsor.tratamiento || ''} ${sponsor.nombre || 'Padrino'}</h3>
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
    // 1. Cargar el CSS de reportes si aún no se ha cargado
    if (!document.getElementById('reports-css')) {
        const link = document.createElement('link');
        link.id = 'reports-css';
        link.rel = 'stylesheet';
        link.href = './reports.css';
        document.head.appendChild(link);
    }

    // 2. Cargar el JS de reportes si aún no se ha cargado
    if (typeof generateReportsContent === 'undefined') {
        const script = document.createElement('script');
        script.src = './reports.js';
        document.body.appendChild(script);

        // 3. Cuando el script cargue, generar el contenido y mostrar el modal
        script.onload = () => {
            generateReportsContent(sponsors);
            reportsModal.classList.remove('hidden');
        };
    } else {
        // Si ya está cargado, solo genera el contenido y muestra el modal
        generateReportsContent(sponsors);
        reportsModal.classList.remove('hidden');
    }
};

// Card Creation and Rendering
const createMainSponsorCard = (sponsor) => {
    const status = getSponsorStatus(sponsor);
    const statusInfo = getVisitStatusInfo(status);
    const fullName = `${sponsor.tratamiento || ''} ${sponsor.nombre || 'Sin nombre'}`.trim();
    const formattedImporte = sponsor.importe ? `$${Number(sponsor.importe).toFixed(2)}` : '$0.00';
    const customTag = sponsor.etiqueta && sponsor.etiqueta.trim() ? `<span class="tag">${sponsor.etiqueta}</span>` : '';
    
    const visitCount = getVisitCount(sponsor);
    
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

    const visitInfo = visitCount > 0 ? `
        <div class="border-t pt-3 mb-3">
            <div class="flex justify-between items-center text-sm text-gray-600">
                <span>${visitCount} visita${visitCount !== 1 ? 's' : ''} registrada${visitCount !== 1 ? 's' : ''}</span>
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
            ${visitInfo}

            <div class="flex justify-between items-center border-t pt-3">
                <span class="text-lg font-bold text-blue-600">${formattedImporte}</span>
                <div class="flex items-center space-x-3">
                    <button class="visit-btn text-green-500 hover:text-green-700" data-id="${sponsor.id}" title="Registrar visita"><i class="fas fa-plus-circle fa-xl"></i></button>
                    <button class="history-btn text-purple-500 hover:text-purple-700" data-id="${sponsor.id}" title="Ver historial"><i class="fas fa-history fa-xl"></i></button>
                    <button class="edit-btn text-orange-500 hover:text-orange-700" data-id="${sponsor.id}" title="Editar"><i class="fas fa-edit fa-xl"></i></button>
                    <button class="delete-btn text-red-500 hover:text-red-700" data-id="${sponsor.id}" title="Eliminar"><i class="fas fa-trash-alt fa-xl"></i></button>
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
    const currentVal = sectorFilter.value;
    sectorFilter.innerHTML = '<option value="all">Todos los sectores</option>';
    [...sectors].sort().forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        sectorFilter.appendChild(option);
    });
    sectorFilter.value = currentVal;
};

const updateTagsList = () => {
    tags.clear();
    sponsors.forEach(sponsor => {
        if (sponsor.etiqueta && sponsor.etiqueta.trim()) tags.add(sponsor.etiqueta.trim());
    });
    const currentVal = tagFilter.value;
    tagFilter.innerHTML = '<option value="all">Todas las etiquetas</option>';
    [...tags].sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
    tagFilter.value = currentVal;
};

const handleSearchInput = () => {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    applyFiltersAndRender();
};

const handleFilterChange = () => {
    currentStatusFilter = statusFilter.value;
    currentSectorFilter = sectorFilter.value;
    currentTagFilter = tagFilter.value;
    applyFiltersAndRender();
};

const applyFiltersAndRender = () => {
    filteredSponsors = sponsors.filter(sponsor => {
        const matchesSearch = currentSearchTerm === '' || 
                            (sponsor.nombre && sponsor.nombre.toLowerCase().includes(currentSearchTerm)) || 
                            (sponsor.numpad && sponsor.numpad.toLowerCase().includes(currentSearchTerm)) ||
                            (sponsor.direccion && sponsor.direccion.toLowerCase().includes(currentSearchTerm));
        
        const sponsorStatus = getSponsorStatus(sponsor);
        const matchesStatus = currentStatusFilter === 'all' || 
                            (currentStatusFilter === 'completed' && sponsorStatus === 'completed') ||
                            (currentStatusFilter === 'visited' && sponsorStatus === 'visited_no_contribution') ||
                            (currentStatusFilter === 'pending' && sponsorStatus === 'pending');
        
        const matchesSector = currentSectorFilter === 'all' || (sponsor.sector && sponsor.sector === currentSectorFilter);
        const matchesTag = currentTagFilter === 'all' || (sponsor.etiqueta && sponsor.etiqueta === currentTagFilter);
        
        return matchesSearch && matchesStatus && matchesSector && matchesTag;
    });
    renderMainList(filteredSponsors);
};

const renderMainList = (sponsorsData) => {
    console.log('Rendering list with', sponsorsData.length, 'sponsors');
    
    const totalCount = sponsors.length;
    const completedCount = sponsors.filter(s => getSponsorStatus(s) === 'completed').length;
    const visitedCount = sponsors.filter(s => getSponsorStatus(s) === 'visited_no_contribution').length;
    const pendingCount = sponsors.filter(s => getSponsorStatus(s) === 'pending').length;
    
    const totalVisitedCount = completedCount + visitedCount;
    
    const collected = calculateTotalCollected();
    const pending = calculateTotalPending();
    
    totalSponsors.textContent = totalCount;
    completedSponsors.textContent = totalVisitedCount;
    pendingSponsors.textContent = pendingCount;
    totalCollected.textContent = `${collected.toFixed(2)}`;
    totalPending.textContent = `${pending.toFixed(2)}`;
    
    sponsorList.classList.add('hidden');
    emptyState.classList.add('hidden');
    noResultsState.classList.add('hidden');
    
    if (sponsors.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    if (sponsorsData.length === 0) {
        noResultsState.classList.remove('hidden');
        return;
    }
    
    sponsorList.classList.remove('hidden');
    sponsorsData.sort((a, b) => {
        const aStatus = getSponsorStatus(a);
        const bStatus = getSponsorStatus(b);
        
        const statusOrder = { pending: 0, visited_no_contribution: 1, completed: 2 };
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

// Event Listeners
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
    }
});

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
        const isValid = await window.authModule.validatePassword(password);
        if (!isValid) {
            deleteError.textContent = 'Contraseña incorrecta';
            deleteError.classList.remove('hidden');
            return;
        }

        await database.ref(`users/${window.userId}/padrinos/${sponsorToDeleteId}`).remove();
        window.showToast('Padrino eliminado');
        confirmModal.classList.add('hidden');
    } catch (error) {
        console.error('Error deleting sponsor:', error);
        window.showToast('Error al eliminar padrino', 'error');
    } finally {
        deleteText.textContent = 'Eliminar';
        deleteSpinner.classList.add('hidden');
        confirmDeleteBtn.disabled = false;
    }
});

// Export functions to global scope
window.makeCall = makeCall;
window.sendWhatsApp = sendWhatsApp;
window.showPhoneActions = showPhoneActions;
window.openGoogleMaps = openGoogleMaps;

// Button event listeners
addSponsorBtn.addEventListener('click', () => openModal());
addFirstSponsorBtn.addEventListener('click', () => openModal());
clearFiltersBtn.addEventListener('click', clearAllFilters);
reportsBtn.addEventListener('click', openReportsModal);

// Visit form event listener
visitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const visitStatus = document.querySelector('input[name="visitStatus"]:checked');
    if (!visitStatus) {
        window.showToast('Selecciona el estado de la visita', 'warning');
        return;
    }
    
    saveVisitText.textContent = "Guardando...";
    saveVisitSpinner.classList.remove('hidden');
    saveVisitBtn.disabled = true;
    
    try {
        if (visitStatus.value === 'reset_pending') {
            const confirmed = confirm('¿Estás seguro de que quieres reiniciar el estado de este padrino? Se borrará todo su historial de visitas de este ciclo.');
            if (confirmed) {
                await database.ref(`users/${window.userId}/padrinos/${currentVisitSponsorId}/visits`).remove();
                showPendingAnimation();
                closeVisitModal();
            }
        } else {
            const sponsor = sponsors.find(s => s.id === currentVisitSponsorId);
            const visitData = {
                status: visitStatus.value,
                notes: visitNotes.value.trim(),
                amount: visitStatus.value === 'completed' ? (parseFloat(sponsor?.importe) || 0) : 0
            };
            await saveVisit(currentVisitSponsorId, visitData);
            showSuccessAnimation();
            closeVisitModal();
        }
    } catch (error) {
        console.error('Error handling visit:', error);
        window.showToast('Error al procesar la visita', 'error');
    } finally {
        saveVisitText.textContent = "Registrar Visita";
        saveVisitSpinner.classList.add('hidden');
        saveVisitBtn.disabled = false;
    }
});

// Modal close event listeners
closeVisitModalBtn.addEventListener('click', closeVisitModal);
cancelVisitBtn.addEventListener('click', closeVisitModal);
closeHistoryModalBtn.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});
closeReportsModalBtn.addEventListener('click', () => {
    reportsModal.classList.add('hidden');
});

// New cycle event listeners
newCycleBtn.addEventListener('click', () => {
    const hasVisits = sponsors.some(s => s.visits && Object.keys(s.visits).length > 0);
    if (!hasVisits) {
        window.showToast('No hay visitas registradas para reiniciar', 'warning');
        return;
    }
    newCycleModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
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
                updates[`users/${window.userId}/padrinos/${sponsor.id}/visits`] = null;
            }
        });
        
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            showNewCycleAnimation();
        }
        
        newCycleModal.classList.add('hidden');
    } catch (error) {
        console.error('Error resetting cycle:', error);
        window.showToast('Error al iniciar nuevo ciclo', 'error');
    } finally {
        newCycleText.textContent = 'Iniciar Ciclo';
        newCycleSpinner.classList.add('hidden');
        confirmNewCycleBtn.disabled = false;
    }
});

// Filter event listeners
statusFilter.addEventListener('change', handleFilterChange);
sectorFilter.addEventListener('change', handleFilterChange);
tagFilter.addEventListener('change', handleFilterChange);

// Location button event listener
getLocationBtn.addEventListener('click', getCurrentLocation);

// Sponsor form event listener
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
            await database.ref(`users/${window.userId}/padrinos/${currentSponsorId}`).update(sponsorData);
            showUpdatedAnimation();
        } else {
            await database.ref(`users/${window.userId}/padrinos`).push(sponsorData);
            window.showToast('Padrino agregado');
        }
        closeModal();
    } catch (e) {
        window.showToast('Error al guardar', 'error');
    } finally {
        saveText.textContent = "Guardar";
        saveSpinner.classList.add('hidden');
        saveSponsorBtn.disabled = false;
    }
});
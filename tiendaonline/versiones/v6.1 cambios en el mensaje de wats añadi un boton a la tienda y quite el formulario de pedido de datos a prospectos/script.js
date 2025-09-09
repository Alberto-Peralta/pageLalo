// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, push, remove, set, onValue, update, get } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const appId = 'default-app-id';

// --- ELEMENTOS DE LA UI ---
const productGrid = document.getElementById('productGrid');
const adminPanel = document.getElementById('adminPanel');
const mainTitle = document.getElementById('mainTitle');
const searchInput = document.getElementById('searchInput');
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
// Modales
const productModal = document.getElementById('productModal');
const messageBox = document.getElementById('messageBox');
const loginModal = document.getElementById('loginModal');
// Carrito
const cartPanel = document.getElementById('cartPanel');
const cartCount = document.getElementById('cartCount');
const openCartBtn = document.getElementById('openCartBtn');
const printOrderBtn = document.getElementById('printOrderBtn');
// Admin
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const adminTableContainer = document.getElementById('adminTableContainer');
let ordersTab, productsTab, ordersContent, productsContent, orderSearch;
let couponsTab, couponsContent, couponForm, submitCouponBtn, cancelCouponBtn, couponsTableContainer;


// --- ESTADO DE LA APLICACIÓN ---
let products = [];
let cart = {};
let admins = {};
let currentUser = null; // Para saber quién está logueado
let adminClicks = 0;
let orders = [];
let coupons = [];


// --- LÓGICA PRINCIPAL ---

// 1. Listener para la lista de administradores (siempre activo)
const adminsRef = ref(db, '/admins');
onValue(adminsRef, (snapshot) => {
    admins = snapshot.val() || {};
    if (currentUser) {
        updateUIBasedOnUserRole(currentUser);
    }
});

// 2. Listener para la autenticación (siempre activo)
onAuthStateChanged(auth, (user) => {
    currentUser = user; 
    updateUIBasedOnUserRole(user); 
});


function updateUIBasedOnUserRole(user) {
    const isAdmin = user && admins[user.uid];
    const clientElements = document.querySelectorAll('.client-search, a[href="order-status.html"]');
    
    if (isAdmin) {
        adminPanel.classList.add('active');
        productGrid.style.display = 'none';
        if (mainTitle) mainTitle.style.display = 'none';
        clientElements.forEach(el => el.style.display = 'none');
        
        setupAdminListeners();
        setupAdminTabs();
    } else {
        adminPanel.classList.remove('active');
        productGrid.style.display = 'grid';
        if (mainTitle) mainTitle.style.display = 'block';
        clientElements.forEach(el => el.style.display = 'inline-flex');
        
        setupRealtimeListeners(); 
    }
}

function setupAdminListeners() {
    setupRealtimeListeners();
    setupAdminOrdersListener();
    setupAdminCouponsListener();
    setupOrderSearch(); // Agregar búsqueda de pedidos
}

function setupRealtimeListeners() {
    const productsRef = ref(db, `/artifacts/${appId}/public/products`);
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        products = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
        products.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        renderProducts(products);
        if (adminTableContainer) renderAdminTable();
        updateCartUI();
    });
}

function setupAdminOrdersListener() {
    const ordersRef = ref(db, `/artifacts/${appId}/public/orders`);
    onValue(ordersRef, (snapshot) => {
        const data = snapshot.val();
        orders = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
        orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderOrdersList();
    });
}

function setupAdminCouponsListener() {
    const couponsRef = ref(db, `/artifacts/${appId}/public/coupons`);
    onValue(couponsRef, (snapshot) => {
        const data = snapshot.val();
        coupons = data ? Object.keys(data).map(code => ({ code, ...data[code] })) : [];
        renderCouponsTable();
    });
}

// --- NUEVA FUNCIÓN: Configurar búsqueda de pedidos ---
function setupOrderSearch() {
    const orderSearch = document.getElementById('orderSearch');
    if (orderSearch) {
        orderSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                renderOrdersList(); // Mostrar todos los pedidos
                return;
            }
            
            const filteredOrders = orders.filter(order => 
                order.customerName?.toLowerCase().includes(searchTerm) ||
                order.customerPhone?.includes(searchTerm) ||
                order.orderNumber?.toString().includes(searchTerm) ||
                order.status?.toLowerCase().includes(searchTerm)
            );
            
            // Renderizar solo los pedidos filtrados
            renderFilteredOrdersList(filteredOrders, searchTerm);
        });
    }
}

// --- RENDERIZADO ---

function renderProducts(productList) {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    productList.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = `product-card relative rounded-3xl shadow-lg p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer`;
        productCard.style.animationDelay = `${index * 50}ms`;

        const isOnSale = product.offerPrice && product.offerPrice < product.price;
        let priceHtml = '';
        let offerBadgeHtml = '';

        if (isOnSale) {
            priceHtml = `
                <div class="flex items-center justify-center gap-2">
                    <span class="text-lg text-gray-500 line-through">$${product.price.toFixed(2)}</span>
                    <span class="text-2xl font-bold text-red-600">$${product.offerPrice.toFixed(2)}</span>
                </div>
            `;
            offerBadgeHtml = `<div class="offer-badge absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">OFERTA</div>`;
        } else {
            priceHtml = `<span class="text-2xl font-bold text-yellow-600">$${product.price.toFixed(2)}</span>`;
        }

        productCard.innerHTML = `
            ${offerBadgeHtml}
            <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4">
            <h3 class="text-xl font-bold mb-2 text-gray-800">${product.name}</h3>
            <p class="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">${product.description}</p>
            <div class="mb-4">${priceHtml}</div>
            <button class="add-to-cart-btn btn-primary w-full">Añadir al Carrito</button>
        `;
        productCard.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product.id);
        });
        productCard.addEventListener('click', () => showProductModal(product));
        productGrid.appendChild(productCard);
    });
}

function renderAdminTable() {
    if (!adminTableContainer) return;
    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
        <thead>
            <tr><th>Imagen</th><th>Artículo</th><th>Precio</th><th class="text-center">Acciones</th></tr>
        </thead>
        <tbody>
            ${products.map(p => `
                <tr>
                    <td><img src="${p.imageUrl}" alt="${p.name}"></td>
                    <td>
                        <div class="font-bold text-gray-800">${p.name}</div>
                        <div class="text-sm text-gray-600">${p.description}</div>
                    </td>
                    <td class="font-semibold text-yellow-600">$${p.price.toFixed(2)}</td>
                    <td>
                        <div class="flex justify-center gap-2">
                            <button class="edit-btn btn-secondary" data-id="${p.id}">Editar</button>
                            <button class="delete-btn bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:bg-red-700" data-id="${p.id}">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `).join('')}
        </tbody>`;
    adminTableContainer.innerHTML = '';
    adminTableContainer.appendChild(table);
    addAdminTableEventListeners();
}

// --- FUNCIÓN ACTUALIZADA: Renderizar lista de pedidos con botones de eliminar ---
function renderOrdersList() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No hay pedidos registrados aún.</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => {
        const statusTextMap = {
            'pendiente': 'Pendiente',
            'confirmado': 'Confirmado', 
            'preparando': 'Preparando',
            'en_camino': 'En camino',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado'
        };

        return `
            <div class="order-item bg-white p-4 rounded-xl shadow">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-bold text-gray-800">Pedido #${order.orderNumber}</h4>
                        <p class="text-sm text-gray-600">${order.customerName || 'Cliente'}</p>
                        <p class="text-sm text-gray-500">${order.customerPhone || 'Sin teléfono'}</p>
                        <p class="text-xs text-gray-400">${new Date(order.timestamp).toLocaleDateString('es-ES')} ${new Date(order.timestamp).toLocaleTimeString('es-ES')}</p>
                    </div>
                    <span class="status-badge status-${order.status || 'pendiente'}">${statusTextMap[order.status || 'pendiente']}</span>
                </div>
                <div class="border-t border-gray-200 pt-3">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-lg font-bold text-gray-800">Total: $${order.total.toFixed(2)}</span>
                        <select class="status-select bg-gray-100 border border-gray-300 text-gray-800 p-1 rounded text-sm" data-order-id="${order.id}">
                            <option value="pendiente" ${(order.status || 'pendiente') === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="confirmado" ${(order.status || 'pendiente') === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                            <option value="preparando" ${(order.status || 'pendiente') === 'preparando' ? 'selected' : ''}>Preparando</option>
                            <option value="en_camino" ${(order.status || 'pendiente') === 'en_camino' ? 'selected' : ''}>En camino</option>
                            <option value="entregado" ${(order.status || 'pendiente') === 'entregado' ? 'selected' : ''}>Entregado</option>
                            <option value="cancelado" ${(order.status || 'pendiente') === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    <!-- NUEVOS BOTONES DE ACCIÓN -->
                    <div class="flex justify-end gap-2 mt-2">
                        <button class="view-order-btn bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors" data-order-id="${order.id}">
                            👁️ Ver Detalles
                        </button>
                        <button class="delete-order-btn bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors" data-order-id="${order.id}">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    reconnectOrderEventListeners();
}

// --- NUEVA FUNCIÓN: Renderizar pedidos filtrados ---
function renderFilteredOrdersList(filteredOrders, searchTerm) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No se encontraron pedidos que coincidan con "${searchTerm}"</p>
                <button onclick="document.getElementById('orderSearch').value = ''; document.getElementById('orderSearch').dispatchEvent(new Event('input'))" class="mt-2 text-blue-500 hover:text-blue-700 underline">
                    Mostrar todos los pedidos
                </button>
            </div>
        `;
        return;
    }

    const statusTextMap = {
        'pendiente': 'Pendiente',
        'confirmado': 'Confirmado', 
        'preparando': 'Preparando',
        'en_camino': 'En camino',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado'
    };

    ordersList.innerHTML = `
        <div class="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-sm text-blue-700">Mostrando ${filteredOrders.length} pedido(s) que coinciden con "${searchTerm}"</p>
        </div>
        ${filteredOrders.map(order => `
            <div class="order-item bg-white p-4 rounded-xl shadow">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-bold text-gray-800">Pedido #${order.orderNumber}</h4>
                        <p class="text-sm text-gray-600">${order.customerName || 'Cliente'}</p>
                        <p class="text-sm text-gray-500">${order.customerPhone || 'Sin teléfono'}</p>
                        <p class="text-xs text-gray-400">${new Date(order.timestamp).toLocaleDateString('es-ES')} ${new Date(order.timestamp).toLocaleTimeString('es-ES')}</p>
                    </div>
                    <span class="status-badge status-${order.status || 'pendiente'}">${statusTextMap[order.status || 'pendiente']}</span>
                </div>
                <div class="border-t border-gray-200 pt-3">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-lg font-bold text-gray-800">Total: $${order.total.toFixed(2)}</span>
                        <select class="status-select bg-gray-100 border border-gray-300 text-gray-800 p-1 rounded text-sm" data-order-id="${order.id}">
                            <option value="pendiente" ${(order.status || 'pendiente') === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="confirmado" ${(order.status || 'pendiente') === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                            <option value="preparando" ${(order.status || 'pendiente') === 'preparando' ? 'selected' : ''}>Preparando</option>
                            <option value="en_camino" ${(order.status || 'pendiente') === 'en_camino' ? 'selected' : ''}>En camino</option>
                            <option value="entregado" ${(order.status || 'pendiente') === 'entregado' ? 'selected' : ''}>Entregado</option>
                            <option value="cancelado" ${(order.status || 'pendiente') === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                        <button class="view-order-btn bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors" data-order-id="${order.id}">
                            👁️ Ver Detalles
                        </button>
                        <button class="delete-order-btn bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors" data-order-id="${order.id}">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
    reconnectOrderEventListeners();
}

// --- FUNCIONES ACTUALIZADAS PARA CUPONES POR PRODUCTO ---
async function saveCoupon() {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseFloat(document.getElementById('couponValue').value);
    const usesInput = document.getElementById('couponUses').value.trim();
    const applicationType = document.getElementById('couponApplicationType').value;
    
    if (!code || !type || !value || value <= 0) {
        showMessage('Error', 'Por favor completa todos los campos correctamente.');
        return;
    }

    // Validaciones específicas
    if (type === 'percentage' && value > 100) {
        showMessage('Error', 'El porcentaje no puede ser mayor a 100%.');
        return;
    }

    const couponData = {
        type: type,
        value: value,
        isActive: true,
        applicationType: applicationType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastUsed: null // ← NUEVO CAMPO AGREGADO
    };

    // Si es para productos específicos, obtener los productos seleccionados
    if (applicationType === 'specific') {
        const selectedProducts = Array.from(document.querySelectorAll('input[name="selectedProducts"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedProducts.length === 0) {
            showMessage('Error', 'Debes seleccionar al menos un producto para cupones específicos.');
            return;
        }
        
        couponData.applicableProducts = selectedProducts;
    }

    // Solo agregar usesRemaining si se especificó un número
    if (usesInput && parseInt(usesInput) > 0) {
        couponData.usesRemaining = parseInt(usesInput);
    }

    try {
        await set(ref(db, `/artifacts/${appId}/public/coupons/${code}`), couponData);
        const isUpdating = document.getElementById('couponCode').readOnly;
        showMessage('Éxito', `Cupón "${code}" ${isUpdating ? 'actualizado' : 'creado'} exitosamente.`);
        resetCouponForm();
    } catch (error) {
        console.error('Error al guardar cupón:', error);
        showMessage('Error', 'Ocurrió un error al guardar el cupón.');
    }
}

// Función para mostrar/ocultar la selección de productos
function toggleProductSelection() {
    const applicationType = document.getElementById('couponApplicationType').value;
    const productSelectionDiv = document.getElementById('productSelection');
    
    if (applicationType === 'specific') {
        productSelectionDiv.classList.remove('hidden');
        renderProductSelection();
    } else {
        productSelectionDiv.classList.add('hidden');
    }
}

// Función para renderizar la selección de productos
function renderProductSelection() {
    const productSelectionDiv = document.getElementById('productSelection');
    if (!productSelectionDiv || products.length === 0) return;

    const productCheckboxes = products.map(product => `
        <label class="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
            <input type="checkbox" name="selectedProducts" value="${product.id}" class="mr-3 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded">
            <img src="${product.imageUrl}" alt="${product.name}" class="w-10 h-10 object-cover rounded-md mr-3">
            <div class="flex-grow">
                <p class="text-sm font-medium text-gray-900">${product.name}</p>
                <p class="text-xs text-gray-500">$${product.price.toFixed(2)}</p>
            </div>
        </label>
    `).join('');

    productSelectionDiv.innerHTML = `
        <div class="max-h-60 overflow-y-auto space-y-2">
            ${productCheckboxes}
        </div>
        <div class="mt-3 flex gap-2">
            <button type="button" onclick="selectAllProducts()" class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                Seleccionar Todo
            </button>
            <button type="button" onclick="clearAllProducts()" class="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">
                Limpiar
            </button>
        </div>
    `;
}

// Funciones auxiliares para selección de productos
function selectAllProducts() {
    document.querySelectorAll('input[name="selectedProducts"]').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function clearAllProducts() {
    document.querySelectorAll('input[name="selectedProducts"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Actualizar la función renderCouponsTable para mostrar información de productos específicos
function renderCouponsTable() {
    couponsTableContainer = document.getElementById('couponsTableContainer');
    if (!couponsTableContainer) return;

    if (coupons.length === 0) {
        couponsTableContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No hay cupones creados aún.</p>
            </div>
        `;
        return;
    }

    const tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aplicación</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${coupons.map(coupon => {
                        let applicationInfo = '';
                        if (coupon.applicationType === 'all') {
                            applicationInfo = '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Todo el carrito</span>';
                        } else if (coupon.applicationType === 'specific' && coupon.applicableProducts) {
                            const productCount = coupon.applicableProducts.length;
                            applicationInfo = `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">${productCount} producto(s)</span>`;
                        }

                        return `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 font-mono font-bold text-gray-900">${coupon.code}</td>
                            <td class="px-4 py-3 text-gray-700">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${coupon.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                    ${coupon.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}
                                </span>
                            </td>
                            <td class="px-4 py-3 font-semibold text-gray-900">
                                ${coupon.value}${coupon.type === 'percentage' ? '%' : '$'}
                            </td>
                            <td class="px-4 py-3">${applicationInfo}</td>
                            <td class="px-4 py-3 text-gray-700">
                                <span class="font-semibold ${coupon.usesRemaining === 0 ? 'text-red-600' : (coupon.usesRemaining !== undefined ? 'text-green-600' : 'text-gray-900')}">
                                    ${coupon.usesRemaining !== undefined ? `${coupon.usesRemaining} restantes` : 'Ilimitado'}
                                </span>
                                ${coupon.lastUsed ? `<br><span class="text-xs text-gray-500">Último uso: ${new Date(coupon.lastUsed).toLocaleDateString()}</span>` : ''}
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${coupon.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex space-x-2">
                                    <button onclick="viewCouponDetails('${coupon.code}')" class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                                        Ver
                                    </button>
                                    <button onclick="editCoupon('${coupon.code}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        Editar
                                    </button>
                                    <button onclick="toggleCouponStatus('${coupon.code}', ${coupon.isActive})" class="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
                                        ${coupon.isActive ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button onclick="deleteCoupon('${coupon.code}')" class="text-red-600 hover:text-red-800 text-sm font-medium">
                                        Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    couponsTableContainer.innerHTML = tableHtml;
}

// Nueva función para ver detalles del cupón
async function viewCouponDetails(code) {
    try {
        const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${code}`);
        const snapshot = await get(couponRef);
        
        if (snapshot.exists()) {
            const coupon = snapshot.val();
            let detailsHtml = `
                <h3 class="text-xl font-bold text-gray-800 mb-4">Detalles del Cupón: ${code}</h3>
                <div class="space-y-3">
                    <div><strong>Tipo:</strong> ${coupon.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</div>
                    <div><strong>Valor:</strong> ${coupon.value}${coupon.type === 'percentage' ? '%' : '$'}</div>
                    <div><strong>Usos restantes:</strong> ${coupon.usesRemaining !== undefined ? coupon.usesRemaining : 'Ilimitado'}</div>
                    <div><strong>Estado:</strong> ${coupon.isActive ? 'Activo' : 'Inactivo'}</div>
                    <div><strong>Creado:</strong> ${new Date(coupon.createdAt).toLocaleString('es-ES')}</div>
            `;

            if (coupon.applicationType === 'specific' && coupon.applicableProducts) {
                const applicableProductNames = coupon.applicableProducts
                    .map(productId => {
                        const product = products.find(p => p.id === productId);
                        return product ? product.name : `ID: ${productId}`;
                    });
                
                detailsHtml += `
                    <div><strong>Aplicable a productos:</strong></div>
                    <ul class="list-disc list-inside ml-4 space-y-1">
                        ${applicableProductNames.map(name => `<li class="text-sm text-gray-600">${name}</li>`).join('')}
                    </ul>
                `;
            } else {
                detailsHtml += `<div><strong>Aplicación:</strong> Todo el carrito</div>`;
            }

            detailsHtml += `</div>`;

            // Mostrar en el modal de mensajes
            document.getElementById('messageTitle').innerHTML = '📋 Detalles del Cupón';
            document.getElementById('messageText').innerHTML = detailsHtml;
            messageBox.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar detalles del cupón:', error);
        showMessage('Error', 'No se pudieron cargar los detalles del cupón.');
    }
}

// Actualizar función editCoupon para manejar productos específicos
async function editCoupon(code) {
    try {
        const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${code}`);
        const snapshot = await get(couponRef);
        
        if (snapshot.exists()) {
            const coupon = snapshot.val();
            
            // Llenar el formulario con los datos del cupón
            document.getElementById('couponCode').value = code;
            document.getElementById('couponCode').readOnly = true;
            document.getElementById('couponType').value = coupon.type;
            document.getElementById('couponValue').value = coupon.value;
            document.getElementById('couponApplicationType').value = coupon.applicationType || 'all';
            
            // Manejar la selección de productos específicos
            toggleProductSelection();
            
            if (coupon.applicationType === 'specific' && coupon.applicableProducts) {
                setTimeout(() => {
                    coupon.applicableProducts.forEach(productId => {
                        const checkbox = document.querySelector(`input[name="selectedProducts"][value="${productId}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }, 100);
            }
            
            // Si existe campo de usos, llenarlo
            const usesInput = document.getElementById('couponUses');
            if (usesInput && coupon.usesRemaining !== undefined) {
                usesInput.value = coupon.usesRemaining;
            }
            
            // Cambiar botón a modo edición
            submitCouponBtn.textContent = 'Actualizar Cupón';
            cancelCouponBtn.classList.remove('hidden');
            
            // Hacer scroll al formulario
            document.getElementById('couponForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al cargar cupón:', error);
        showMessage('Error', 'No se pudo cargar el cupón para editar.');
    }
}

// Función para aplicar cupón en order-preview (actualizada para productos específicos)
// --- FUNCIÓN PARA APLICAR CUPONES DESDE ORDER-PREVIEW ---
async function applyCouponToOrder(couponCode, orderData, products) {
    try {
        const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${couponCode.toUpperCase()}`);
        const snapshot = await get(couponRef);

        if (!snapshot.exists() || !snapshot.val().isActive) {
            return { success: false, message: 'El código del cupón no es válido o ha expirado.' };
        }

        const coupon = snapshot.val();
        
        // Validar usos disponibles
        if (coupon.usesRemaining !== undefined && coupon.usesRemaining <= 0) {
            return { success: false, message: 'Este cupón ya no tiene usos disponibles.' };
        }

        let discountAmount = 0;
        let applicableItems = [];

        if (coupon.applicationType === 'specific' && coupon.applicableProducts) {
            // Calcular descuento solo para productos específicos
            const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            
            for (const [productId, quantity] of Object.entries(orderData.cart)) {
                if (coupon.applicableProducts.includes(productId)) {
                    const product = productMap[productId];
                    if (product) {
                        const priceToUse = (product.offerPrice && product.offerPrice < product.price) 
                            ? product.offerPrice : product.price;
                        const itemSubtotal = priceToUse * quantity;
                        
                        if (coupon.type === 'percentage') {
                            discountAmount += itemSubtotal * (coupon.value / 100);
                        } else {
                            // Para descuento fijo, aplicar proporcionalmente
                            const totalApplicableValue = Object.entries(orderData.cart)
                                .filter(([id]) => coupon.applicableProducts.includes(id))
                                .reduce((sum, [id, qty]) => {
                                    const prod = products.find(p => p.id === id);
                                    if (prod) {
                                        const price = (prod.offerPrice && prod.offerPrice < prod.price) 
                                            ? prod.offerPrice : prod.price;
                                        return sum + (price * qty);
                                    }
                                    return sum;
                                }, 0);
                            
                            if (totalApplicableValue > 0) {
                                const proportion = itemSubtotal / totalApplicableValue;
                                discountAmount += Math.min(coupon.value * proportion, itemSubtotal);
                            }
                        }
                        
                        applicableItems.push(product.name);
                    }
                }
            }
        } else {
            // Aplicar a todo el carrito
            const subtotal = orderData.subtotal || orderData.total;
            if (coupon.type === 'percentage') {
                discountAmount = subtotal * (coupon.value / 100);
            } else {
                discountAmount = coupon.value;
            }
            discountAmount = Math.min(discountAmount, subtotal);
        }

        if (discountAmount > 0) {
            // Decrementar usos si es limitado
            if (coupon.usesRemaining !== undefined) {
                await update(couponRef, {
                    usesRemaining: coupon.usesRemaining - 1,
                    updatedAt: Date.now(),
                    lastUsed: Date.now()
                });
            }
            
            let successMessage = `¡Cupón "${couponCode}" aplicado con éxito!`;
            if (coupon.applicationType === 'specific') {
                successMessage += ` Descuento aplicado a: ${applicableItems.join(', ')}`;
            }
            if (coupon.usesRemaining !== undefined) {
                successMessage += `\nUsos restantes: ${coupon.usesRemaining - 1}`;
            }
            
            return { 
                success: true, 
                discountAmount, 
                coupon: { ...coupon, applicableItems },
                message: successMessage
            };
        } else {
            return { 
                success: false, 
                message: 'Este cupón no se puede aplicar a los productos seleccionados.' 
            };
        }

    } catch (error) {
        console.error('Error al aplicar cupón:', error);
        return { success: false, message: 'Error al verificar el cupón.' };
    }
}
// Alternar estado del cupón (activo/inactivo)
async function toggleCouponStatus(code, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';
    
    if (confirm(`¿Estás seguro de que quieres ${action} el cupón "${code}"?`)) {
        try {
            await update(ref(db, `/artifacts/${appId}/public/coupons/${code}`), {
                isActive: newStatus,
                updatedAt: Date.now()
            });
            showMessage('Éxito', `Cupón "${code}" ${newStatus ? 'activado' : 'desactivado'} exitosamente.`);
        } catch (error) {
            console.error('Error al cambiar estado del cupón:', error);
            showMessage('Error', 'No se pudo cambiar el estado del cupón.');
        }
    }
}

// Eliminar cupón
async function deleteCoupon(code) {
    if (confirm(`¿Estás seguro de que quieres eliminar el cupón "${code}"?\n\nEsta acción no se puede deshacer.`)) {
        try {
            await remove(ref(db, `/artifacts/${appId}/public/coupons/${code}`));
            showMessage('Éxito', `Cupón "${code}" eliminado exitosamente.`);
        } catch (error) {
            console.error('Error al eliminar cupón:', error);
            showMessage('Error', 'No se pudo eliminar el cupón.');
        }
    }
}

// Resetear formulario de cupones
function resetCouponForm() {
    couponForm.reset();
    const codeInput = document.getElementById('couponCode');
    codeInput.readOnly = false;
    submitCouponBtn.textContent = 'Agregar Cupón';
    cancelCouponBtn.classList.add('hidden');
    document.getElementById('productSelection').classList.add('hidden');
}

// Hacer funciones globales para los botones onclick
window.toggleProductSelection = toggleProductSelection;
window.selectAllProducts = selectAllProducts;
window.clearAllProducts = clearAllProducts;
window.viewCouponDetails = viewCouponDetails;
window.editCoupon = editCoupon;
window.toggleCouponStatus = toggleCouponStatus;
window.deleteCoupon = deleteCoupon;
window.applyCouponToOrder = applyCouponToOrder;

// --- CARRITO ---
function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    updateCartUI();
}
function removeFromCart(productId) {
    if (cart[productId]) delete cart[productId];
    updateCartUI();
}
function updateCartUI() {
    const totalCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
    cartCount.textContent = totalCount;
    openCartBtn.classList.toggle('hidden', totalCount === 0);
    
    const cartList = document.getElementById('cartList');
    if (!cartList) return;
    cartList.innerHTML = '';
    
    const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    let total = 0;
    Object.entries(cart).forEach(([id, quantity]) => {
        const product = productMap[id];
        if (product) {
            const priceToUse = (product.offerPrice && product.offerPrice < product.price) ? product.offerPrice : product.price;
            total += priceToUse * quantity;
            const item = document.createElement('li');
            item.className = 'bg-gray-50 p-3 rounded-lg flex items-center gap-4 border border-gray-200';
            item.innerHTML = `
                <img src="${product.imageUrl}" class="w-16 h-16 object-cover rounded-md">
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">${product.name}</h4>
                    <p class="text-xs text-gray-600">Cantidad: ${quantity}</p>
                </div>
                <button class="remove-from-cart-btn text-red-500 hover:text-red-700 font-bold text-xl" data-id="${id}">&times;</button>`;
            item.querySelector('.remove-from-cart-btn').addEventListener('click', () => removeFromCart(id));
            cartList.appendChild(item);
        }
    });
    document.getElementById('cartTotal').textContent = `${total.toFixed(2)}`;
}

// --- MODALES Y MENSAJES ---
function showProductModal(product) {
    productModal.querySelector('#modalImage').src = product.imageUrl;
    productModal.querySelector('#modalName').textContent = product.name;
    productModal.querySelector('#modalDescription').textContent = product.description;
    productModal.querySelector('#modalPrice').textContent = `${product.price.toFixed(2)}`;
    productModal.style.display = 'flex';
}
function showMessage(title, text) {
    messageBox.querySelector('#messageTitle').textContent = title;
    messageBox.querySelector('#messageText').textContent = text;
    messageBox.style.display = 'flex';
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Cerrar modales
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.close-button') || e.target.closest('#closeMessageBtn')) {
                modal.style.display = 'none';
            }
        });
    });

    if (searchInput) searchInput.addEventListener('input', () => renderProducts(products.filter(p => p.name.toLowerCase().includes(searchInput.value.toLowerCase()))));
    
    if (openCartBtn) openCartBtn.addEventListener('click', () => cartPanel.classList.add('active'));
    document.getElementById('closeCartBtn')?.addEventListener('click', () => cartPanel.classList.remove('active'));

    if(mainTitle) mainTitle.addEventListener('click', () => {
        adminClicks = (adminClicks + 1) % 5;
        if (adminClicks === 0) loginModal.style.display = 'flex';
    });

    // --- FORMULARIO Y LÓGICA DE ADMIN ---
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = authEmailInput.value;
            const password = authPasswordInput.value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginModal.style.display = 'none';
                showMessage('Inicio de Sesión Exitoso', `Bienvenido, se han cargado los permisos de administrador.`);
            } catch (error) {
                showMessage('Error de Autenticación', 'Correo o contraseña incorrectos. Inténtalo de nuevo.');
            }
        });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

    if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);
    if (cancelBtn) cancelBtn.addEventListener('click', resetProductForm);

    if (printOrderBtn) printOrderBtn.addEventListener('click', () => {
        if (Object.keys(cart).length === 0) return showMessage('Carrito Vacío', 'Añade artículos para continuar.');
        
        const total = Object.entries(cart).reduce((sum, [id, qty]) => {
            const product = products.find(p => p.id === id);
            if (product) {
                const priceToUse = (product.offerPrice && product.offerPrice < product.price) ? product.offerPrice : product.price;
                return sum + priceToUse * qty;
            }
            return sum;
        }, 0);

        const orderPreviewData = {
            cart: { ...cart },
            total: total,
            orderId: crypto.randomUUID(),
            orderNumber: Math.floor(100000 + Math.random() * 900000)
        };
        window.location.href = `order-preview.html?data=${encodeURIComponent(JSON.stringify(orderPreviewData))}`;
    });

    // Inicializar elementos de cupones
    couponForm = document.getElementById('couponForm');
    submitCouponBtn = document.getElementById('submitCouponBtn');
    cancelCouponBtn = document.getElementById('cancelCouponBtn');
    
    if (couponForm) {
        couponForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveCoupon();
        });
    }
    if(cancelCouponBtn) {
        cancelCouponBtn.addEventListener('click', resetCouponForm);
    }

    // Convertir código a mayúsculas automáticamente
    const couponCodeInput = document.getElementById('couponCode');
    if (couponCodeInput) {
        couponCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
});

function addAdminTableEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const product = products.find(p => p.id === e.target.dataset.id);
        if (product) {
            productIdInput.value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productOfferPrice').value = product.offerPrice || '';
            document.getElementById('productImage').value = product.imageUrl;
            submitBtn.textContent = 'Actualizar Artículo';
            cancelBtn.classList.remove('hidden');
        }
    }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async (e) => {
        if (confirm('¿Seguro que quieres eliminar este artículo?')) {
            await remove(ref(db, `/artifacts/${appId}/public/products/${e.target.dataset.id}`));
            showMessage('Éxito', 'Artículo eliminado.');
        }
    }));
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const offerPriceValue = document.getElementById('productOfferPrice').value;
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        imageUrl: document.getElementById('productImage').value,
        timestamp: Date.now(),
        offerPrice: offerPriceValue ? parseFloat(offerPriceValue) : null 
    };
    const id = productIdInput.value;
    const dbRef = id ? ref(db, `/artifacts/${appId}/public/products/${id}`) : push(ref(db, `/artifacts/${appId}/public/products`));
    await set(dbRef, productData);
    showMessage('Éxito', `Artículo ${id ? 'actualizado' : 'agregado'} correctamente.`);
    resetProductForm();
}

function resetProductForm() {
    productForm.reset();
    productIdInput.value = '';
    submitBtn.textContent = 'Agregar Artículo';
    cancelBtn.classList.add('hidden');
}

function setupAdminTabs() {
    productsTab = document.getElementById('productsTab');
    ordersTab = document.getElementById('ordersTab');
    couponsTab = document.getElementById('couponsTab');

    productsContent = document.getElementById('productsContent');
    ordersContent = document.getElementById('ordersContent');
    couponsContent = document.getElementById('couponsContent');
    
    if (!ordersTab || !productsTab || !couponsTab) return;
    
    const setActiveTab = (activeTab) => {
        [productsTab, ordersTab, couponsTab].forEach(tab => {
            tab.classList.toggle('border-yellow-500', tab === activeTab);
            tab.classList.toggle('font-semibold', tab === activeTab);
            tab.classList.toggle('text-gray-800', tab === activeTab);
            tab.classList.toggle('text-gray-500', tab !== activeTab);
        });
        productsContent.classList.toggle('hidden', activeTab !== productsTab);
        ordersContent.classList.toggle('hidden', activeTab !== ordersTab);
        couponsContent.classList.toggle('hidden', activeTab !== couponsTab);
    };
    productsTab.addEventListener('click', () => setActiveTab(productsTab));
    ordersTab.addEventListener('click', () => setActiveTab(ordersTab));
    couponsTab.addEventListener('click', () => setActiveTab(couponsTab));
}

// --- FUNCIÓN ACTUALIZADA: Event listeners para pedidos con eliminación ---
function reconnectOrderEventListeners() {
    // Event listeners para cambio de estado
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;
            try {
                await update(ref(db, `/artifacts/${appId}/public/orders/${orderId}`), { 
                    status: newStatus,
                    lastUpdated: Date.now()
                });
                showMessage('Estado Actualizado', `El pedido ahora está: ${newStatus}`);
            } catch (error) {
                console.error('Error al actualizar estado:', error);
                showMessage('Error', 'No se pudo actualizar el estado del pedido');
            }
        });
    });

    // NEW: Event listeners para ver detalles del pedido
    document.querySelectorAll('.view-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            // Abrir en nueva ventana la página de detalles del pedido
            window.open(`order-preview.html?id=${orderId}`, '_blank');
        });
    });

    // NEW: Event listeners para eliminar pedidos
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            const order = orders.find(o => o.id === orderId);
            
            if (!order) {
                showMessage('Error', 'No se encontró el pedido');
                return;
            }

            // Confirmación doble para evitar eliminaciones accidentales
            const confirmMessage = `¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE el pedido #${order.orderNumber}?

Cliente: ${order.customerName || 'Cliente'}
Total: ${order.total.toFixed(2)}
Fecha: ${new Date(order.timestamp).toLocaleDateString('es-ES')}

⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️`;

            if (confirm(confirmMessage)) {
                // Segunda confirmación
                if (confirm('⚠️ CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar este pedido? Esta acción es irreversible.')) {
                    try {
                        await remove(ref(db, `/artifacts/${appId}/public/orders/${orderId}`));
                        showMessage('Pedido Eliminado', `El pedido #${order.orderNumber} ha sido eliminado permanentemente.`);
                        
                        // Opcional: También eliminar de la lista local para actualización inmediata
                        const orderIndex = orders.findIndex(o => o.id === orderId);
                        if (orderIndex > -1) {
                            orders.splice(orderIndex, 1);
                            renderOrdersList(); // Re-renderizar la lista
                        }
                    } catch (error) {
                        console.error('Error al eliminar pedido:', error);
                        showMessage('Error', 'No se pudo eliminar el pedido. Inténtalo de nuevo.');
                    }
                }
            }
        });
    });
}


// --- FUNCIÓN PARA OBTENER DETALLES DEL CUPÓN ---
async function getCouponDetails(couponCode) {
    try {
        const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${couponCode.toUpperCase()}`);
        const snapshot = await get(couponRef);
        
        if (snapshot.exists()) {
            return { success: true, coupon: snapshot.val() };
        } else {
            return { success: false, message: 'Cupón no encontrado' };
        }
    } catch (error) {
        console.error('Error al obtener detalles del cupón:', error);
        return { success: false, message: 'Error al buscar el cupón' };
    }
}

// --- HACER FUNCIONES GLOBALES PARA ORDER-PREVIEW ---
window.applyCouponToOrder = applyCouponToOrder;
window.getCouponDetails = getCouponDetails;
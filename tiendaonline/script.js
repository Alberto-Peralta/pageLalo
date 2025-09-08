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
const catalog = document.getElementById('catalog');
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
        if (catalog) catalog.style.display = 'none';
        if (mainTitle) mainTitle.style.display = 'none';
        clientElements.forEach(el => el.style.display = 'none');
        
        setupAdminListeners();
        setupAdminTabs();
    } else {
        if (adminPanel) adminPanel.classList.remove('active');
        if (catalog) catalog.style.display = 'grid';
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
    setupCouponListeners(); // Agregado para conectar los listeners de cupones
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
    if (!catalog) return;
    catalog.innerHTML = '';
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
        catalog.appendChild(productCard);
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

function renderCouponsTable() {
    couponsTableContainer = document.getElementById('couponList');
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
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${coupons.map(coupon => `
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
                            <td class="px-4 py-3 text-gray-700">
                                <span class="font-semibold ${coupon.usesRemaining === 0 ? 'text-red-600' : 'text-gray-900'}">
                                    ${coupon.usesRemaining !== undefined ? coupon.usesRemaining : '∞'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${coupon.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex space-x-2">
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
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    couponsTableContainer.innerHTML = tableHtml;
}

// --- CARRITO ---
function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    updateCartUI();
    showMessage('Artículo añadido al carrito.', 'success');
}

function updateCartUI() {
    const cartList = document.getElementById('cartList');
    const cartTotalElement = document.getElementById('cartTotal');
    const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

    if (cartList) {
        cartList.innerHTML = '';
        let total = 0;
        let cartItems = [];
        
        for (const productId in cart) {
            const product = products.find(p => p.id === productId);
            if (product && cart[productId] > 0) {
                const price = product.offerPrice !== undefined && product.offerPrice < product.price ? product.offerPrice : product.price;
                const subtotal = price * cart[productId];
                total += subtotal;

                cartItems.push(`
                    <li class="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
                        <img src="${product.imageUrl}" alt="${product.name}" class="w-16 h-16 object-cover rounded-lg">
                        <div class="flex-1 min-w-0">
                            <h4 class="text-base font-semibold text-gray-900 truncate">${product.name}</h4>
                            <p class="text-sm text-gray-500">Precio: $${price.toFixed(2)}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="btn-quantity" onclick="changeQuantity('${productId}', -1)">-</button>
                            <span class="quantity-display font-medium text-gray-900">${cart[productId]}</span>
                            <button class="btn-quantity" onclick="changeQuantity('${productId}', 1)">+</button>
                        </div>
                        <span class="font-bold text-gray-900 ml-auto">$${subtotal.toFixed(2)}</span>
                    </li>
                `);
            }
        }
        cartList.innerHTML = cartItems.join('');
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    if (cartCount) {
        cartCount.textContent = totalItems > 0 ? totalItems : '';
        cartCount.classList.toggle('hidden', totalItems === 0);
    }
}

function changeQuantity(productId, delta) {
    cart[productId] = (cart[productId] || 0) + delta;
    if (cart[productId] <= 0) {
        delete cart[productId];
    }
    updateCartUI();
}

function showProductModal(product) {
    if (!productModal) {
        console.error("Product modal not found.");
        return;
    }
    const modalContent = document.getElementById('productModalContent');
    const isOnSale = product.offerPrice && product.offerPrice < product.price;
    let priceHtml = '';

    if (isOnSale) {
        priceHtml = `
            <div class="flex items-center gap-2">
                <span class="text-2xl text-gray-500 line-through">$${product.price.toFixed(2)}</span>
                <span class="text-3xl font-bold text-red-600">$${product.offerPrice.toFixed(2)}</span>
            </div>
            <span class="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">OFERTA</span>
        `;
    } else {
        priceHtml = `<span class="text-3xl font-bold text-yellow-600">$${product.price.toFixed(2)}</span>`;
    }

    modalContent.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6 items-center">
            <div class="flex-shrink-0">
                <img src="${product.imageUrl}" alt="${product.name}" class="w-full md:w-64 h-auto md:h-64 object-cover rounded-xl shadow-lg">
            </div>
            <div class="flex-1">
                <h3 class="text-3xl font-bold text-gray-900 mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-4">${product.description}</p>
                <div class="mb-4">${priceHtml}</div>
                <button onclick="addToCart('${product.id}'); hideModal('productModal')" class="btn-primary w-full md:w-auto">
                    Añadir al Carrito
                </button>
            </div>
        </div>
    `;
    productModal.classList.add('active');
}

function showMessage(message, type) {
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.classList.add('active');
        setTimeout(() => {
            messageBox.classList.remove('active');
        }, 3000);
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// --- EVENTOS Y LÓGICA DE ADMINISTRACIÓN ---

function addAdminTableEventListeners() {
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        editProduct(id);
    }));

    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        deleteProduct(id);
    }));
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
            tab.classList.toggle('hover:text-gray-800', tab !== activeTab);
            tab.classList.toggle('hover:text-gray-500', tab === activeTab);
        });
        productsContent.classList.toggle('hidden', activeTab !== productsTab);
        ordersContent.classList.toggle('hidden', activeTab !== ordersTab);
        couponsContent.classList.toggle('hidden', activeTab !== couponsTab);
    };

    productsTab.addEventListener('click', () => setActiveTab(productsTab));
    ordersTab.addEventListener('click', () => setActiveTab(ordersTab));
    couponsTab.addEventListener('click', () => setActiveTab(couponsTab));
    setActiveTab(productsTab);
}

function addListeners() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
            adminClicks++;
            if (adminClicks >= 3) {
                adminBtn.style.display = 'none';
            }
        });
    }

    const closeAdminBtn = document.getElementById('closeAdminBtn');
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            adminPanel.classList.remove('active');
            adminBtn.style.display = 'block';
            adminClicks = 0;
            updateUIBasedOnUserRole(currentUser);
        });
    }

    const closeProductModalBtn = document.getElementById('closeProductModalBtn');
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => hideModal('productModal'));
    }

    const openCartBtn = document.getElementById('openCartBtn');
    if (openCartBtn) {
        openCartBtn.addEventListener('click', () => {
            cartPanel.classList.add('active');
        });
    }

    const closeCartBtn = document.getElementById('closeCartBtn');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartPanel.classList.remove('active');
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetProductForm);
    }
}

function showCouponsContent() {
    const couponsTableContainer = document.getElementById('couponsTableContainer');
    if (!couponsTableContainer) {
        const couponsContent = document.getElementById('couponsContent');
        if (couponsContent) {
            const container = document.createElement('div');
            container.id = 'couponsTableContainer';
            couponsContent.appendChild(container);
        }
    }
}

// --- MANEJO DE PEDIDOS EN EL ADMIN ---

function reconnectOrderEventListeners() {
    const statusSelects = document.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;
            updateOrderStatus(orderId, newStatus);
        });
    });

    const deleteOrderBtns = document.querySelectorAll('.delete-order-btn');
    deleteOrderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            deleteOrder(orderId);
        });
    });
}

function updateOrderStatus(orderId, newStatus) {
    const orderRef = ref(db, `/artifacts/${appId}/public/orders/${orderId}`);
    update(orderRef, { status: newStatus })
        .then(() => {
            showMessage('Estado del pedido actualizado correctamente.', 'success');
        })
        .catch(error => {
            console.error("Error al actualizar el estado del pedido:", error);
            showMessage('Error al actualizar el estado del pedido.', 'error');
        });
}

function deleteOrder(orderId) {
    const confirmation = confirm("¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.");
    if (confirmation) {
        const orderRef = ref(db, `/artifacts/${appId}/public/orders/${orderId}`);
        remove(orderRef)
            .then(() => {
                showMessage('Pedido eliminado correctamente.', 'success');
            })
            .catch(error => {
                console.error("Error al eliminar el pedido:", error);
                showMessage('Error al eliminar el pedido.', 'error');
            });
    }
}

// --- MANEJO DE PRODUCTOS EN EL ADMIN ---

function handleProductFormSubmit(e) {
    e.preventDefault();
    const id = productIdInput.value;
    const productData = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        offerPrice: document.getElementById('productOfferPrice').value ? parseFloat(document.getElementById('productOfferPrice').value) : null,
        imageUrl: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value,
        stock: parseInt(document.getElementById('productStock').value),
        isActive: document.getElementById('isActive').checked
    };

    if (id) {
        updateProduct(id, productData);
    } else {
        addProduct(productData);
    }
}

function addProduct(product) {
    const productsRef = ref(db, `/artifacts/${appId}/public/products`);
    const newProductRef = push(productsRef);
    set(newProductRef, { ...product, timestamp: Date.now() })
        .then(() => {
            showMessage('Producto agregado correctamente.', 'success');
            resetProductForm();
        })
        .catch(error => showMessage(`Error al agregar producto: ${error.message}`, 'error'));
}

function updateProduct(id, productData) {
    const productRef = ref(db, `/artifacts/${appId}/public/products/${id}`);
    update(productRef, productData)
        .then(() => {
            showMessage('Producto actualizado correctamente.', 'success');
            resetProductForm();
        })
        .catch(error => showMessage(`Error al actualizar producto: ${error.message}`, 'error'));
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    productIdInput.value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOfferPrice').value = product.offerPrice;
    document.getElementById('productImage').value = product.imageUrl;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('isActive').checked = product.isActive;
    submitBtn.textContent = 'Guardar Cambios';
    cancelBtn.classList.remove('hidden');
}

function deleteProduct(id) {
    const productsRef = ref(db, `/artifacts/${appId}/public/products/${id}`);
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
        remove(productsRef)
            .then(() => showMessage('Producto eliminado.', 'success'))
            .catch(error => showMessage(`Error al eliminar producto: ${error.message}`, 'error'));
    }
}

function resetProductForm() {
    productForm.reset();
    productIdInput.value = '';
    submitBtn.textContent = 'Agregar Artículo';
    cancelBtn.classList.add('hidden');
}

// --- MANEJO DE CUPONES EN EL ADMIN ---
function setupCouponListeners() {
    couponForm = document.getElementById('couponForm');
    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponFormSubmit);
    }
    const cancelCouponBtn = document.getElementById('cancelCouponBtn');
    if (cancelCouponBtn) {
        cancelCouponBtn.addEventListener('click', resetCouponForm);
    }
    const isSpecificToProducts = document.getElementById('isSpecificToProducts');
    if (isSpecificToProducts) {
        isSpecificToProducts.addEventListener('change', (e) => {
            const productSelectionContainer = document.getElementById('productSelectionContainer');
            if (e.target.checked) {
                productSelectionContainer.classList.remove('hidden');
                renderProductSelectionCheckboxes(null);
            } else {
                productSelectionContainer.classList.add('hidden');
            }
        });
    }
    const selectAllProductsBtn = document.getElementById('selectAllProductsBtn');
    if (selectAllProductsBtn) {
        selectAllProductsBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#productSelectionList input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = true);
        });
    }

    const clearAllProductsBtn = document.getElementById('clearAllProductsBtn');
    if (clearAllProductsBtn) {
        clearAllProductsBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#productSelectionList input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        });
    }
}

function handleCouponFormSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('couponCode').value.toUpperCase().trim();
    const type = document.getElementById('couponType').value;
    const value = parseFloat(document.getElementById('couponValue').value);
    const expiration = document.getElementById('couponExpiration').value;
    const uses = document.getElementById('couponUses').value;
    const isActive = document.getElementById('couponIsActive').checked;
    const isSpecificToProducts = document.getElementById('isSpecificToProducts').checked;
    const applicableProducts = isSpecificToProducts ? getSelectedProducts() : null;

    if (coupons.some(c => c.code === code) && couponIdInput.value !== code) {
        showMessage('Error: El código de cupón ya existe.', 'error');
        return;
    }
    
    const couponData = {
        code: code,
        type: type,
        value: value,
        expiration: expiration || null,
        usesRemaining: uses ? parseInt(uses) : null,
        isActive: isActive,
        isSpecificToProducts: isSpecificToProducts,
        applicableProducts: applicableProducts,
    };
    
    if (couponIdInput.value) {
        updateCoupon(couponIdInput.value, couponData);
    } else {
        addCoupon(couponData);
    }
}

function addCoupon(couponData) {
    const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${couponData.code}`);
    set(couponRef, couponData)
        .then(() => {
            showMessage('Cupón agregado correctamente.', 'success');
            resetCouponForm();
        })
        .catch(error => showMessage(`Error al agregar cupón: ${error.message}`, 'error'));
}

function updateCoupon(code, couponData) {
    const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${code}`);
    update(couponRef, couponData)
        .then(() => {
            showMessage('Cupón actualizado correctamente.', 'success');
            resetCouponForm();
        })
        .catch(error => showMessage(`Error al actualizar cupón: ${error.message}`, 'error'));
}

function editCoupon(code) {
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) return;
    
    couponIdInput.value = coupon.code;
    document.getElementById('couponCode').value = coupon.code;
    document.getElementById('couponType').value = coupon.type;
    document.getElementById('couponValue').value = coupon.value;
    document.getElementById('couponExpiration').value = coupon.expiration || '';
    document.getElementById('couponUses').value = coupon.usesRemaining !== null ? coupon.usesRemaining : '';
    document.getElementById('couponIsActive').checked = coupon.isActive;
    document.getElementById('isSpecificToProducts').checked = coupon.isSpecificToProducts;
    
    const productSelectionContainer = document.getElementById('productSelectionContainer');
    if (coupon.isSpecificToProducts) {
        productSelectionContainer.classList.remove('hidden');
        renderProductSelectionCheckboxes(coupon.applicableProducts);
    } else {
        productSelectionContainer.classList.add('hidden');
        renderProductSelectionCheckboxes(null);
    }

    document.getElementById('saveCouponBtn').textContent = 'Guardar Cambios';
    document.getElementById('cancelCouponBtn').classList.remove('hidden');
}

function deleteCoupon(code) {
    const confirmation = confirm("¿Estás seguro de que quieres eliminar este cupón?");
    if (confirmation) {
        const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${code}`);
        remove(couponRef)
            .then(() => showMessage('Cupón eliminado correctamente.', 'success'))
            .catch(error => showMessage(`Error al eliminar cupón: ${error.message}`, 'error'));
    }
}

function toggleCouponStatus(code, currentStatus) {
    const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${code}`);
    update(couponRef, { isActive: !currentStatus })
        .then(() => {
            showMessage(`Cupón ${!currentStatus ? 'activado' : 'desactivado'} correctamente.`, 'success');
        })
        .catch(error => showMessage(`Error al cambiar el estado del cupón: ${error.message}`, 'error'));
}

function resetCouponForm() {
    couponForm.reset();
    couponIdInput.value = '';
    document.getElementById('saveCouponBtn').textContent = 'Guardar Cupón';
    document.getElementById('cancelCouponBtn').classList.add('hidden');
    document.getElementById('productSelectionContainer').classList.add('hidden');
    renderProductSelectionCheckboxes(null);
}

function renderProductSelectionCheckboxes(selectedProductIds) {
    const productSelectionList = document.getElementById('productSelectionList');
    if (!productSelectionList) return;
    
    productSelectionList.innerHTML = products.map(product => `
        <div class="flex items-center space-x-2">
            <input type="checkbox" id="product-${product.id}" value="${product.id}" class="rounded text-yellow-500 focus:ring-yellow-400" ${selectedProductIds && selectedProductIds.includes(product.id) ? 'checked' : ''}>
            <label for="product-${product.id}" class="text-sm text-gray-700">${product.name}</label>
        </div>
    `).join('');
}

function getSelectedProducts() {
    const checkboxes = document.querySelectorAll('#productSelectionList input[type="checkbox"]');
    const selectedIds = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedIds.push(checkbox.value);
        }
    });
    return selectedIds;
}

// Llamadas iniciales
document.addEventListener('DOMContentLoaded', () => {
    setupAdminTabs();
    addListeners();
    updateCartUI(); 
    setupRealtimeListeners();
    renderProductSelectionCheckboxes(null); // Initial render for coupon form
    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponFormSubmit);
    }
    const couponIdInput = document.getElementById('couponIdInput');
    const saveCouponBtn = document.getElementById('saveCouponBtn');
    const cancelCouponBtn = document.getElementById('cancelCouponBtn');
    if (cancelCouponBtn) {
        cancelCouponBtn.addEventListener('click', resetCouponForm);
    }
});
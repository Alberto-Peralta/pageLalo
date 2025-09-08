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
    setupCouponFormListeners();
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

        productCard.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            addToCart(product);
        });
        
        productCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart-btn')) {
                showProductModal(product);
            }
        });
        productGrid.appendChild(productCard);
    });
}

function renderAdminTable() {
    if (!adminTableContainer) return;
    if (products.length === 0) {
        adminTableContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No hay artículos registrados aún. ¡Empieza añadiendo uno!</p>
            </div>
        `;
        return;
    }

    const table = document.createElement('table');
    table.className = 'min-w-full bg-white rounded-xl shadow-md overflow-hidden';
    table.innerHTML = `
        <thead class="bg-gray-100 border-b border-gray-200">
            <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
            ${products.map(p => `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-900">${p.name}</td>
                    <td class="px-4 py-3 text-gray-700">$${p.price.toFixed(2)} ${p.offerPrice ? `<span class="text-red-500 line-through ml-2">$${p.offerPrice.toFixed(2)}</span>` : ''}</td>
                    <td class="px-4 py-3 text-sm">
                        <div class="flex space-x-2">
                            <button class="edit-btn btn-secondary" data-id="${p.id}">Editar</button>
                            <button class="delete-btn bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:bg-red-700" data-id="${p.id}">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

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

    const statusTextMap = {
        'pendiente': 'Pendiente',
        'confirmado': 'Confirmado',
        'preparando': 'Preparando',
        'en_camino': 'En camino',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado'
    };

    ordersList.innerHTML = orders.map(order => `
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
                    <h5 class="font-semibold text-gray-700">Artículos:</h5>
                    <span class="text-gray-600">${Object.keys(order.items || {}).length}</span>
                </div>
                <ul class="text-sm text-gray-600 space-y-1">
                    ${Object.values(order.items || {}).map(item => `
                        <li>${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>
                    `).join('')}
                </ul>
                <div class="mt-3 flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>$${(order.total || 0).toFixed(2)}</span>
                </div>
                <div class="mt-4 space-y-2">
                    <label class="block text-sm font-medium text-gray-600">Actualizar Estado:</label>
                    <select data-order-id="${order.id}" class="status-select w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900">
                        <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                        <option value="preparando" ${order.status === 'preparando' ? 'selected' : ''}>Preparando</option>
                        <option value="en_camino" ${order.status === 'en_camino' ? 'selected' : ''}>En camino</option>
                        <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </div>
                <div class="mt-4 flex gap-2">
                    <button class="view-order-btn btn-secondary w-full" data-order-id="${order.id}">Ver Detalles</button>
                    <button class="delete-order-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full" data-order-id="${order.id}">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');

    addOrderListEventListeners();
}

function renderFilteredOrdersList(filteredOrders, searchTerm) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    const statusTextMap = {
        'pendiente': 'Pendiente',
        'confirmado': 'Confirmado',
        'preparando': 'Preparando',
        'en_camino': 'En camino',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado'
    };

    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No se encontraron resultados para "${searchTerm}".</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = `
        <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                        <h5 class="font-semibold text-gray-700">Artículos:</h5>
                        <span class="text-gray-600">${Object.keys(order.items || {}).length}</span>
                    </div>
                    <ul class="text-sm text-gray-600 space-y-1">
                        ${Object.values(order.items || {}).map(item => `
                            <li>${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>
                        `).join('')}
                    </ul>
                    <div class="mt-3 flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span>$${(order.total || 0).toFixed(2)}</span>
                    </div>
                    <div class="mt-4 space-y-2">
                        <label class="block text-sm font-medium text-gray-600">Actualizar Estado:</label>
                        <select data-order-id="${order.id}" class="status-select w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900">
                            <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                            <option value="preparando" ${order.status === 'preparando' ? 'selected' : ''}>Preparando</option>
                            <option value="en_camino" ${order.status === 'en_camino' ? 'selected' : ''}>En camino</option>
                            <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                            <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    <div class="mt-4 flex gap-2">
                        <button class="view-order-btn btn-secondary w-full" data-order-id="${order.id}">Ver Detalles</button>
                        <button class="delete-order-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full" data-order-id="${order.id}">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;

    addOrderListEventListeners();
}

function renderCart() {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    const total = Object.values(cart).reduce((sum, item) => {
        const price = item.offerPrice !== undefined ? item.offerPrice : item.price;
        return sum + (price * item.quantity);
    }, 0);

    if (Object.keys(cart).length === 0) {
        cartList.innerHTML = `<li class="text-center text-gray-500 mt-8">Tu carrito está vacío.</li>`;
        openCartBtn.classList.add('hidden');
    } else {
        cartList.innerHTML = Object.values(cart).map(item => {
            const price = item.offerPrice !== undefined ? item.offerPrice : item.price;
            return `
                <li class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg shadow-sm">
                    <img src="${item.imageUrl}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                    <div class="flex-grow">
                        <h4 class="font-bold text-gray-800">${item.name}</h4>
                        <p class="text-sm text-gray-600">$${price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <span class="font-bold text-gray-900">$${(price * item.quantity).toFixed(2)}</span>
                </li>
            `;
        }).join('');
        openCartBtn.classList.remove('hidden');
    }
    cartTotal.textContent = `$${total.toFixed(2)}`;
    updateCartCount();
}

function renderCouponsTable() {
    couponsTableContainer = document.getElementById('couponsTableContainer');
    if (!couponsTableContainer) return;
    
    if (coupons.length === 0) {
        couponsTableContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No hay cupones registrados aún.</p>
            </div>
        `;
        return;
    }

    const tableHtml = `
        <div class="overflow-x-auto bg-white rounded-xl shadow-md">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos Restantes</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${coupons.map(coupon => `
                        <tr>
                            <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">${coupon.code}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                ${coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-center font-medium">
                                <span class="${coupon.usesRemaining === 0 ? 'text-red-600' : 'text-gray-900'}">
                                    ${coupon.usesRemaining !== undefined ? coupon.usesRemaining : '∞'}
                                </span>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${coupon.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <div class="flex space-x-2">
                                    <button onclick="editCoupon('${coupon.code}')" class="text-blue-600 hover:text-blue-800">Editar</button>
                                    <button onclick="toggleCouponStatus('${coupon.code}', ${coupon.isActive})" class="text-yellow-600 hover:text-yellow-800">
                                        ${coupon.isActive ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button onclick="deleteCoupon('${coupon.code}')" class="text-red-600 hover:text-red-800">Eliminar</button>
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


function updateCartCount() {
    const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count > 0 ? count : '';
    openCartBtn.classList.toggle('hidden', count === 0);
}

function updateCartUI() {
    renderCart();
    updateCartCount();
}

function showProductModal(product) {
    const modalImage = document.getElementById('modalImage');
    const modalName = document.getElementById('modalName');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    const closeButton = productModal.querySelector('.close-button');

    if (product) {
        modalImage.src = product.imageUrl;
        modalName.textContent = product.name;
        modalDescription.textContent = product.description;
        
        const isOnSale = product.offerPrice && product.offerPrice < product.price;
        if (isOnSale) {
            modalPrice.innerHTML = `<span class="text-lg text-gray-500 line-through">$${product.price.toFixed(2)}</span> <span class="text-2xl font-bold text-red-600">$${product.offerPrice.toFixed(2)}</span>`;
        } else {
            modalPrice.textContent = `$${product.price.toFixed(2)}`;
        }
        
        productModal.style.display = 'block';
    }

    closeButton.onclick = () => { productModal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target === productModal) { productModal.style.display = 'none'; }
    };
}

function showMessage(title, message) {
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    const closeMessageBtn = document.getElementById('closeMessageBtn');

    messageTitle.textContent = title;
    messageText.textContent = message;
    messageBox.style.display = 'block';

    closeMessageBtn.onclick = () => { messageBox.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target === messageBox) { messageBox.style.display = 'none'; }
    };
}


// --- LÓGICA DE FORMULARIOS Y ACCIONES ---

async function handleProductFormSubmit(event) {
    event.preventDefault();
    const productId = productIdInput.value;
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const offerPrice = document.getElementById('productOfferPrice').value ? parseFloat(document.getElementById('productOfferPrice').value) : null;
    const description = document.getElementById('productDescription').value;
    const imageUrl = document.getElementById('productImage').value;

    const productData = { name, price, offerPrice, description, imageUrl, timestamp: Date.now() };

    try {
        if (productId) {
            await update(ref(db, `/artifacts/${appId}/public/products/${productId}`), productData);
            showMessage('Éxito', `Artículo "${name}" actualizado exitosamente.`);
        } else {
            const newProductRef = push(ref(db, `/artifacts/${appId}/public/products`));
            await set(newProductRef, productData);
            showMessage('Éxito', `Artículo "${name}" agregado exitosamente.`);
        }
        resetProductForm();
    } catch (error) {
        console.error('Error al guardar el artículo:', error);
        showMessage('Error', 'Ocurrió un error al guardar el artículo.');
    }
}

async function handleCouponFormSubmit(event) {
    event.preventDefault();
    const code = document.getElementById('couponCode').value.toUpperCase().trim();
    const type = document.getElementById('couponType').value;
    const value = parseFloat(document.getElementById('couponValue').value);
    const usesInput = document.getElementById('couponUses').value;

    if (!code || !type || isNaN(value)) {
        showMessage('Error', 'Por favor, completa todos los campos obligatorios.');
        return;
    }

    const couponData = {
        code,
        type,
        value,
        isActive: true,
        usesRemaining: usesInput ? parseInt(usesInput) : null,
        timestamp: Date.now()
    };

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

// Lógica para editar un cupón
async function editCoupon(code) {
    try {
        const couponRef = ref(db, `/artifacts/${appId}/public/coupons/${code}`);
        const snapshot = await get(couponRef);
        if (snapshot.exists()) {
            const coupon = snapshot.val();
            document.getElementById('couponCode').value = code;
            document.getElementById('couponCode').readOnly = true;
            document.getElementById('couponType').value = coupon.type;
            document.getElementById('couponValue').value = coupon.value;
            document.getElementById('couponUses').value = coupon.usesRemaining !== null ? coupon.usesRemaining : '';
            submitCouponBtn.textContent = 'Actualizar Cupón';
            cancelCouponBtn.classList.remove('hidden');
            couponsTab.click();
        } else {
            showMessage('Error', 'No se encontró el cupón.');
        }
    } catch (error) {
        console.error('Error al editar cupón:', error);
        showMessage('Error', 'No se pudo cargar el cupón para edición.');
    }
}

// Lógica para alternar el estado de un cupón
async function toggleCouponStatus(code, isActive) {
    if (confirm(`¿Estás seguro de que quieres ${isActive ? 'desactivar' : 'activar'} el cupón "${code}"?`)) {
        try {
            await update(ref(db, `/artifacts/${appId}/public/coupons/${code}`), { isActive: !isActive });
            showMessage('Éxito', `Cupón "${code}" ${isActive ? 'desactivado' : 'activado'} correctamente.`);
        } catch (error) {
            console.error('Error al cambiar estado del cupón:', error);
            showMessage('Error', 'No se pudo cambiar el estado del cupón.');
        }
    }
}

// Lógica para eliminar un cupón
async function deleteCoupon(code) {
    if (confirm(`¿Estás seguro de que quieres eliminar el cupón "${code}"?`)) {
        try {
            await remove(ref(db, `/artifacts/${appId}/public/coupons/${code}`));
            showMessage('Éxito', `Cupón "${code}" eliminado correctamente.`);
        } catch (error) {
            console.error('Error al eliminar cupón:', error);
            showMessage('Error', 'No se pudo eliminar el cupón.');
        }
    }
}

function resetProductForm() {
    productForm.reset();
    productIdInput.value = '';
    submitBtn.textContent = 'Agregar Artículo';
    cancelBtn.classList.add('hidden');
}

function resetCouponForm() {
    couponForm.reset();
    document.getElementById('couponCode').readOnly = false;
    submitCouponBtn.textContent = 'Agregar Cupón';
    cancelCouponBtn.classList.add('hidden');
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
    setActiveTab(productsTab);
}

function setupCouponFormListeners() {
    couponForm = document.getElementById('couponForm');
    submitCouponBtn = document.getElementById('submitCouponBtn');
    cancelCouponBtn = document.getElementById('cancelCouponBtn');

    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponFormSubmit);
    }
    if (cancelCouponBtn) {
        cancelCouponBtn.addEventListener('click', () => {
            resetCouponForm();
        });
    }
}

function addAdminTableEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit) {
                productIdInput.value = productToEdit.id;
                document.getElementById('productName').value = productToEdit.name;
                document.getElementById('productPrice').value = productToEdit.price;
                document.getElementById('productOfferPrice').value = productToEdit.offerPrice || '';
                document.getElementById('productDescription').value = productToEdit.description;
                document.getElementById('productImage').value = productToEdit.imageUrl;
                submitBtn.textContent = 'Actualizar Artículo';
                cancelBtn.classList.remove('hidden');
                productsTab.click();
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.target.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
                try {
                    await remove(ref(db, `/artifacts/${appId}/public/products/${productId}`));
                    showMessage('Éxito', 'Artículo eliminado correctamente.');
                } catch (error) {
                    console.error('Error al eliminar el artículo:', error);
                    showMessage('Error', 'Ocurrió un error al eliminar el artículo.');
                }
            }
        });
    });
}

function addOrderListEventListeners() {
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;
            try {
                await update(ref(db, `/artifacts/${appId}/public/orders/${orderId}`), { status: newStatus, lastUpdated: Date.now() });
                showMessage('Estado Actualizado', `El pedido ahora está: ${newStatus}`);
            } catch (error) {
                console.error('Error al actualizar estado:', error);
                showMessage('Error', 'No se pudo actualizar el estado del pedido');
            }
        });
    });

    document.querySelectorAll('.view-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            window.open(`order-preview.html?id=${orderId}`, '_blank');
        });
    });

    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                showMessage('Error', 'No se encontró el pedido a eliminar.');
                return;
            }
            if (confirm(`¿Estás seguro de que quieres eliminar el pedido #${order.orderNumber}?`)) {
                try {
                    await remove(ref(db, `/artifacts/${appId}/public/orders/${orderId}`));
                    showMessage('Éxito', `El pedido #${order.orderNumber} ha sido eliminado.`);
                } catch (error) {
                    console.error('Error al eliminar el pedido:', error);
                    showMessage('Error', 'Hubo un problema al intentar eliminar el pedido.');
                }
            }
        });
    });
}

// --- LÓGICA DEL CARRITO ---

function addToCart(product) {
    if (cart[product.id]) {
        cart[product.id].quantity += 1;
    } else {
        cart[product.id] = { ...product, quantity: 1 };
    }
    updateCartUI();
    showMessage('Añadido al Carrito', `${product.name} ha sido añadido al carrito.`);
}

function updateCartItemQuantity(productId, quantity) {
    if (cart[productId]) {
        if (quantity <= 0) {
            delete cart[productId];
        } else {
            cart[productId].quantity = quantity;
        }
        updateCartUI();
    }
}

function clearCart() {
    cart = {};
    updateCartUI();
}

function checkout() {
    if (Object.keys(cart).length === 0) {
        showMessage('Carrito Vacío', 'Añade artículos para continuar.');
        return;
    }

    const orderNumber = Date.now();
    const customerData = {
        name: 'Cliente de Prueba',
        phone: '1234567890'
    };

    const orderData = {
        orderNumber,
        items: cart,
        total: Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0),
        customerName: customerData.name,
        customerPhone: customerData.phone,
        status: 'pendiente',
        timestamp: Date.now()
    };
    
    // Aquí puedes guardar el pedido en tu base de datos si lo necesitas
    // push(ref(db, '/orders'), orderData);
    
    clearCart();
    showMessage('¡Pedido Realizado!', `Tu pedido #${orderNumber} ha sido registrado. Te contactaremos pronto.`);
}

// --- EVENT LISTENERS ---

if (mainTitle) {
    mainTitle.addEventListener('click', () => {
        adminClicks++;
        if (adminClicks >= 7) {
            loginModal.style.display = 'block';
            adminClicks = 0; // Resetear el contador para evitar activaciones accidentales
        }
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
        renderProducts(filteredProducts);
    });
}

if (openCartBtn) openCartBtn.addEventListener('click', () => cartPanel.classList.add('translate-x-0'));
if (document.getElementById('closeCartBtn')) document.getElementById('closeCartBtn').addEventListener('click', () => cartPanel.classList.remove('translate-x-0'));

if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
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
    const total = Object.entries(cart).reduce((sum, [id, item]) => sum + (item.offerPrice || item.price) * item.quantity, 0);
    const orderData = {
        orderNumber: Date.now(),
        items: cart,
        total: total,
        timestamp: Date.now()
    };
    const encodedData = encodeURIComponent(JSON.stringify(orderData));
    window.location.href = `order-preview.html?data=${encodedData}`;
});
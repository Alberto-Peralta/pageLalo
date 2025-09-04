// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, push, remove, set, onValue, update } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

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


// --- ESTADO DE LA APLICACIÓN ---
let products = [];
let cart = {};
let admins = {};
let currentUser = null; // Para saber quién está logueado
let adminClicks = 0;
let orders = [];


// --- LÓGICA PRINCIPAL ---

// 1. Listener para la lista de administradores (siempre activo)
const adminsRef = ref(db, '/admins');
onValue(adminsRef, (snapshot) => {
    admins = snapshot.val() || {};
    // Si ya hay un usuario logueado, re-evaluamos su rol con la nueva lista de admins
    if (currentUser) {
        updateUIBasedOnUserRole(currentUser);
    }
});

// 2. Listener para la autenticación (siempre activo)
onAuthStateChanged(auth, (user) => {
    currentUser = user; // Actualizamos el usuario actual
    updateUIBasedOnUserRole(user); // Actualizamos la UI
});


function updateUIBasedOnUserRole(user) {
    const isAdmin = user && admins[user.uid];
    const clientElements = document.querySelectorAll('.client-search, a[href="order-status.html"]');
    
    if (isAdmin) {
        adminPanel.classList.add('active');
        productGrid.style.display = 'none';
        if (mainTitle) mainTitle.style.display = 'none';
        clientElements.forEach(el => el.style.display = 'none');
        
        setupAdminListeners(); // Carga datos de productos y pedidos
        setupAdminTabs();
    } else {
        adminPanel.classList.remove('active');
        productGrid.style.display = 'grid';
        if (mainTitle) mainTitle.style.display = 'block';
        clientElements.forEach(el => el.style.display = 'inline-flex');
        
        setupRealtimeListeners(); // Carga solo productos
    }
}

function setupAdminListeners() {
    setupRealtimeListeners(); // Los admins también necesitan la lista de productos
    setupAdminOrdersListener();
}

function setupRealtimeListeners() {
    const productsRef = ref(db, `/artifacts/${appId}/public/products`);
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        products = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
        products.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        renderProducts(products);
        if (adminTableContainer) renderAdminTable(); // Actualiza la tabla de admin si existe
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


// --- RENDERIZADO ---

function renderProducts(productList) {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    productList.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = `product-card rounded-3xl shadow-lg p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer`;
        productCard.style.animationDelay = `${index * 50}ms`;
        productCard.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4">
            <h3 class="text-xl font-bold mb-2 text-gray-800">${product.name}</h3>
            <p class="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">${product.description}</p>
            <span class="text-2xl font-bold text-yellow-600 mb-4">$${product.price.toFixed(2)}</span>
            <button class="add-to-cart-btn btn-primary w-full">Añadir al carrito</button>
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

function renderOrdersList() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item bg-white p-4 rounded-xl shadow">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-bold text-gray-800">Pedido #${order.orderNumber}</h4>
                    <p class="text-sm text-gray-600">${order.customerName}</p>
                    <p class="text-sm text-gray-500">${order.customerPhone}</p>
                </div>
                <span class="status-badge status-${order.status || 'pendiente'}">${order.status || 'pendiente'}</span>
            </div>
            <div class="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span class="text-lg font-bold text-gray-800">Total: $${order.total.toFixed(2)}</span>
                <select class="status-select bg-gray-100 border border-gray-300 text-gray-800 p-1 rounded text-sm" data-order-id="${order.id}">
                    <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                    <option value="preparando" ${order.status === 'preparando' ? 'selected' : ''}>Preparando</option>
                    <option value="en_camino" ${order.status === 'en_camino' ? 'selected' : ''}>En camino</option>
                    <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                    <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>
    `).join('');
    reconnectOrderEventListeners();
}

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
            total += product.price * quantity;
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
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

// --- MODALES Y MENSAJES ---
function showProductModal(product) {
    productModal.querySelector('#modalImage').src = product.imageUrl;
    productModal.querySelector('#modalName').textContent = product.name;
    productModal.querySelector('#modalDescription').textContent = product.description;
    productModal.querySelector('#modalPrice').textContent = `$${product.price.toFixed(2)}`;
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
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // onAuthStateChanged se encargará de actualizar la UI.
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
        const total = Object.values(cart).reduce((sum, qty, i) => sum + (products.find(p => p.id === Object.keys(cart)[i])?.price || 0) * qty, 0);
        const orderPreviewData = {
            cart: { ...cart },
            total: total,
            orderId: crypto.randomUUID(),
            orderNumber: Math.floor(100000 + Math.random() * 900000)
        };
        window.location.href = `order-preview.html?data=${encodeURIComponent(JSON.stringify(orderPreviewData))}`;
    });
});

function addAdminTableEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const product = products.find(p => p.id === e.target.dataset.id);
        if (product) {
            productIdInput.value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
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

function reconnectOrderEventListeners() {
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const { orderId } = e.target.dataset;
            const newStatus = e.target.value;
            await update(ref(db, `/artifacts/${appId}/public/orders/${orderId}`), { status: newStatus });
            showMessage('Estado Actualizado', `El pedido ahora está: ${newStatus}`);
        });
    });
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        imageUrl: document.getElementById('productImage').value,
        timestamp: Date.now()
    };
    const id = productIdInput.value;
    const dbRef = id ? ref(db, `/artifacts/${appId}/public/products/${id}`) : ref(db, `/artifacts/${appId}/public/products`);
    const action = id ? set : push;
    await action(dbRef, productData);
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
    ordersTab = document.getElementById('ordersTab');
    productsTab = document.getElementById('productsTab');
    ordersContent = document.getElementById('ordersContent');
    productsContent = document.getElementById('productsContent');
    if (!ordersTab || !productsTab) return;
    
    const setActiveTab = (activeTab) => {
        [productsTab, ordersTab].forEach(tab => {
            tab.classList.toggle('border-yellow-500', tab === activeTab);
            tab.classList.toggle('font-semibold', tab === activeTab);
            tab.classList.toggle('text-gray-800', tab === activeTab);
            tab.classList.toggle('text-gray-500', tab !== activeTab);
        });
        productsContent.classList.toggle('hidden', activeTab !== productsTab);
        ordersContent.classList.toggle('hidden', activeTab !== ordersTab);
    };
    productsTab.addEventListener('click', () => setActiveTab(productsTab));
    ordersTab.addEventListener('click', () => setActiveTab(ordersTab));
}
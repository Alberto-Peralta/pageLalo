// Variables globales proporcionadas por el entorno Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
    authDomain: "pagelalo-1b210.firebaseapp.com",
    databaseURL: "https://pagelalo-1b210-default-rtdb.firebaseio.com",
    projectId: "pagelalo-1b210",
    storageBucket: "pagelalo-1b210.firebasestorage.app",
    messagingSenderId: "1096735980204",
    appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, push, remove, set, onValue, update } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Elementos de la UI
const productGrid = document.getElementById('productGrid');
const productModal = document.getElementById('productModal');
const modalImage = document.getElementById('modalImage');
const modalName = document.getElementById('modalName');
const modalDescription = document.getElementById('modalDescription');
const modalPrice = document.getElementById('modalPrice');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const adminPanel = document.getElementById('adminPanel');
const productForm = document.getElementById('productForm');
const adminProductList = document.getElementById('adminProductList');
const searchInput = document.getElementById('searchInput');
const confirmBox = document.getElementById('confirmBox');
const confirmText = document.getElementById('confirmText');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const productIdInput = document.getElementById('productId');
const closeMessageBtn = document.getElementById('closeMessageBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const loginBtn = document.getElementById('loginBtn');
const mainTitle = document.getElementById('mainTitle');
const cartCount = document.getElementById('cartCount');
const printOrderBtn = document.getElementById('printOrderBtn');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartPanel = document.getElementById('cartPanel');
const logoutBtn = document.getElementById('logoutBtn');
const catalog = document.getElementById('catalog');

// Elementos de la UI
const cartBtn = document.getElementById('cartBtn');
// Estado de la aplicación
let db;
let auth;
let userId;
let products = [];
let cart = {};
let admins = {};
let adminClicks = 0;

let orders = [];
let ordersTab = null, productsTab = null, ordersContent = null, productsContent = null, orderSearch = null;

/**
 * Inicializa la conexión con Firebase y realiza la autenticación anónima.
 * Esta función ahora solo se encarga de la configuración inicial.
 */
async function initializeFirebase() {
    try {
        if (!firebaseConfig.databaseURL && firebaseConfig.projectId) {
            firebaseConfig.databaseURL = `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;
        }
        
        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
        
        // Intenta autenticar anónimamente. Se movió la lógica de la UI fuera de aquí.
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
    } catch (authError) {
        console.warn("Error en autenticación, continuando sin auth:", authError);
    }
}

/**
 * Gestiona los cambios de autenticación y decide qué mostrar en la UI.
 * Esta es la función principal que controla la lógica de la aplicación.
 */
function handleAuthentication() {
    onAuthStateChanged(auth, (user) => {
        const adminsRef = ref(db, '/admins');

        // Se obtiene la lista de admins de Firebase.
        // La clave es que el resto del código se ejecuta DENTRO de esta función,
        // asegurando que la lista de 'admins' ya se haya cargado.
        onValue(adminsRef, (snapshot) => {
            admins = snapshot.val() || {};
            
            // Una vez que tenemos la lista de admins, actualizamos la interfaz.
            // Esto soluciona el error de que el admin no era reconocido.
            updateUIBasedOnUserRole(user);

        }, { onlyOnce: true }); // Carga la lista solo una vez por eficiencia.
    });
}

/**
 * Actualiza la interfaz de usuario (UI) según si el usuario es un administrador o un cliente.
 */
function updateUIBasedOnUserRole(user) {
    const isAdmin = user && admins[user.uid];

    // Referencias a los elementos del DOM
    const adminPanel = document.getElementById('adminPanel');
    const productGrid = document.getElementById('productGrid');
    const clientSearch = document.querySelector('.client-search'); // Buscador cliente
    const adminSearch = document.querySelector('.admin-search');   // Buscador admin
    const mainTitle = document.getElementById('mainTitle');
    const orderStatusButton = document.querySelector('a[href="order-status.html"]');

    if (isAdmin) {
        // --- VISTA DE ADMINISTRADOR ---
        adminPanel.classList.remove('hidden');
        adminPanel.classList.add('active');
        if (productGrid) productGrid.classList.add('hidden');
        
        // OCULTAR buscador cliente, MOSTRAR buscador admin
        if (clientSearch) clientSearch.classList.add('hidden');
        if (adminSearch) adminSearch.classList.remove('hidden');
        
        // Ocultar elementos de la vista cliente
        if (mainTitle) mainTitle.style.display = 'none';
        if (orderStatusButton) orderStatusButton.style.display = 'none';

        // Carga los datos necesarios para el admin
        setupAdminOrdersListener();
        setupRealtimeListeners();

    } else {
        // --- VISTA DE CLIENTE / PÚBLICA ---
        adminPanel.classList.add('hidden');
        adminPanel.classList.remove('active');
        if (productGrid) productGrid.classList.remove('hidden');
        
        // MOSTRAR buscador cliente, OCULTAR buscador admin
        if (clientSearch) clientSearch.classList.remove('hidden');
        if (adminSearch) adminSearch.classList.add('hidden');
        
        // Mostrar elementos de la vista cliente
        if (mainTitle) mainTitle.style.display = 'block';
        if (orderStatusButton) orderStatusButton.style.display = 'inline-flex';

        // Carga los productos para el catálogo público
        setupRealtimeListeners();
    }
}

/**
 * Punto de entrada de la aplicación al cargar la página.
 */
window.onload = async () => {
    await initializeFirebase(); // 1. Primero, conecta con Firebase
    handleAuthentication();     // 2. Luego, maneja la lógica de la aplicación
};

// Modifica setupRealtimeListeners para manejar errores de permisos
function setupRealtimeListeners() {
    if (!db) return;

    // Listener para productos (su única responsabilidad)
    const productsRef = ref(db, `/artifacts/${appId}/public/products`);
    onValue(productsRef, (snapshot) => {
        products = [];
        const data = snapshot.val();
        if (data) {
            for (const id in data) {
                products.push({ id, ...data[id] });
            }
        }
        // Ordena los productos por fecha de creación (si existe)
        products.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        // Renderiza los productos en ambas vistas (pública y admin)
        renderProducts(products);
        renderAdminProductList();
        updateCartUI();

    }, (error) => {
        console.error("Error al cargar productos:", error);
        showMessage('Modo offline', 'No se pudo conectar a la base de datos. Mostrando productos de ejemplo.');
        loadSampleProducts();
    });
}

// AÑADE esta nueva función para el listener de pedidos
function setupAdminOrdersListener() {
    const ordersRef = ref(db, `/artifacts/${appId}/public/orders`);
    onValue(ordersRef, (snapshot) => {
        orders = [];
        const data = snapshot.val();
        if (data) {
            for (const id in data) {
                orders.push({ id, ...data[id] });
            }
        }
        orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Más recientes primero
        renderOrdersList();
    }, (error) => {
        console.warn("Error al cargar pedidos:", error);
    });
}

// Función de productos de ejemplo para modo offline
function loadSampleProducts() {
    products = [
        {
            id: 'sample1',
            name: 'Rosario Tradicional',
            description: 'Rosario de madera con cuentas ovaladas y detalles de metal',
            price: 150.00,
            imageUrl: 'https://loremflickr.com/400/300/rosary?random=1'
        },
        {
            id: 'sample2', 
            name: 'Cruz de San Benito',
            description: 'Crucifijo de metal con la medalla de San Benito, ideal para protección',
            price: 250.00,
            imageUrl: 'https://loremflickr.com/400/300/cross?random=2'
        }
    ];
    renderProducts(products);
}

/**
 * Muestra un cuadro de mensaje personalizado.
 * @param {string} title - El título del mensaje.
 * @param {string} text - El texto del mensaje.
 */
function showMessage(title, text) {
    if (messageTitle && messageText && messageBox) {
        messageTitle.textContent = title;
        messageText.textContent = text;
        messageBox.style.display = 'flex';
    }
}

/**
 * Muestra un cuadro de diálogo de confirmación.
 * @param {string} message - El mensaje de confirmación.
 * @returns {Promise<boolean>} Una promesa que se resuelve en true si se confirma, false en caso contrario.
 */
function showConfirm(message, title = 'Confirmar acción') {
    if (!confirmText || !confirmBox || !confirmYesBtn || !confirmNoBtn) {
        console.error("Elementos de confirmación no encontrados");
        return Promise.resolve(false);
    }
    
    confirmText.textContent = message;
    if (title && messageTitle) {
        messageTitle.textContent = title;
    }
    confirmBox.style.display = 'flex';

    return new Promise((resolve) => {
        confirmYesBtn.onclick = () => {
            confirmBox.style.display = 'none';
            resolve(true);
        };
        confirmNoBtn.onclick = () => {
            confirmBox.style.display = 'none';
            resolve(false);
        };
    });
}

/**
 * Renderiza las tarjetas de productos en la cuadrícula principal.
 * @param {Array<Object>} productList - La lista de productos a renderizar.
 */
function renderProducts(productList) {
    if (!productGrid) return;
    
    productGrid.innerHTML = '';
    if (productList.length === 0) {
        productGrid.innerHTML = '<p class="text-center text-gray-500 text-lg col-span-full">No se encontraron productos que coincidan con la búsqueda.</p>';
        return;
    }
    
    productList.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = `product-card bg-gray-800 rounded-3xl shadow-lg p-6 flex flex-col items-center text-center transition-transform hover:scale-105 hover:shadow-2xl cursor-pointer`;
        productCard.style.animationDelay = `${index * 0.1}s`;
        productCard.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Imagen+no+disponible'">
            <h3 class="text-xl font-bold mb-2 text-white">${product.name}</h3>
            <p class="text-sm text-gray-400 mb-4 line-clamp-3">${product.description}</p>
            <span class="text-2xl font-bold text-yellow-500 mb-4">$${product.price}</span>
            <button class="add-to-cart-btn btn-primary">Añadir al Carrito</button>
        `;
        
        productCard.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product.id, productCard);
        });
        productCard.addEventListener('click', () => showProductModal(product));
        
        productGrid.appendChild(productCard);
    });
}

function showProductModal(product) {
    if (!modalImage || !modalName || !modalDescription || !modalPrice || !productModal) return;
    
    modalImage.src = product.imageUrl;
    modalName.textContent = product.name;
    modalDescription.textContent = product.description;
    modalPrice.textContent = `$${product.price}`;
    productModal.style.display = 'flex';
}

function addToCart(productId, productElement) {
    cart[productId] = (cart[productId] || 0) + 1;
    updateCartUI();
    
    const cartButton = document.getElementById('openCartBtn');
    if (productElement && cartButton) {
        const startRect = productElement.getBoundingClientRect();
        const endRect = cartButton.getBoundingClientRect();
        const flyingProductClone = document.createElement('div');
        flyingProductClone.className = 'flying-product';
        flyingProductClone.style.top = `${startRect.top}px`;
        flyingProductClone.style.left = `${startRect.left}px`;
        flyingProductClone.style.width = `${startRect.width}px`;
        flyingProductClone.style.height = `${startRect.height}px`;
        flyingProductClone.innerHTML = productElement.innerHTML;
        const buttonsInClone = flyingProductClone.querySelectorAll('button, .add-to-cart-btn');
        buttonsInClone.forEach(btn => btn.style.display = 'none');
        const imgInClone = flyingProductClone.querySelector('img');
        if (imgInClone) {
            imgInClone.style.width = '100%'; 
            imgInClone.style.height = '100px'; 
            imgInClone.style.objectFit = 'contain';
        }
        document.body.appendChild(flyingProductClone);
        requestAnimationFrame(() => {
            const targetX = endRect.left + (endRect.width / 2) - (startRect.width / 2);
            const targetY = endRect.top + (endRect.height / 2) - (startRect.height / 2);
            flyingProductClone.style.transform = `translate(${targetX - startRect.left}px, ${targetY - startRect.top}px) scale(0)`;
            flyingProductClone.style.opacity = '0';
        });
        setTimeout(() => {
            flyingProductClone.remove();
        }, 800);
    }
}

function removeFromCart(productId) {
    if (cart[productId]) {
        delete cart[productId];
    }
    updateCartUI();
}

function updateCartUI() {
    if (!cartCount) return;
    
    const totalCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
    cartCount.textContent = totalCount;
    const cartList = document.getElementById('cartList');
    
    if (!cartList) return;
    
    cartList.innerHTML = '';

    if (totalCount > 0 && openCartBtn) {
        openCartBtn.classList.remove('hidden');
    } else if (openCartBtn) {
        openCartBtn.classList.add('hidden');
        if (cartPanel) cartPanel.classList.remove('active');
        cartList.innerHTML = `
            <div class="text-center text-gray-400 py-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-16 w-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.254.632 1.254H20m-2 7a2 2 0 11-4 0 2 2 0 014 0zM6 21a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p class="mt-4 text-lg">Tu carrito está vacío</p>
                <p class="text-sm">Añade productos para verlos aquí.</p>
            </div>
        `;
    }
            
        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {});    let total = 0;

    for (const id in cart) {
        if (cart[id] > 0) {
            const product = productMap[id];
            if (product) {
                 total += product.price * cart[id]; 
                 const listItem = document.createElement('li');
                 listItem.className = 'bg-gray-700 p-3 rounded-lg flex items-center gap-4 shadow-md';
                 listItem.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}" class="w-16 h-16 object-cover rounded-md" onerror="this.onerror=null;this.src='https://placehold.co/64x64/e2e8f0/64748b?text=N/A'">
                    <div class="flex-grow">
                        <h4 class="text-sm font-bold text-white">${product.name}</h4>
                        <p class="text-xs text-gray-400">Cantidad: ${cart[id]}</p>
                        <p class="text-sm font-semibold text-yellow-500">$${product.price.toFixed(2)}</p>
                    </div>
                    <button class="remove-from-cart-btn text-red-400 hover:text-red-500 font-bold" data-id="${id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                 `;
                listItem.querySelector('.remove-from-cart-btn').addEventListener('click', () => {
                    removeFromCart(id);
                });
                cartList.appendChild(listItem);
            }
        }
    }

    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

function generatePrintContent() {
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p;
        });    let total = 0;
    
    let itemsHtml = Object.keys(cart).map(id => {
        const product = productMap[id];
        if (!product) return '';
        const count = cart[id];
        total += product.price * count;
        return `
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 16px;">
                <img src="${product.imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div>
                    <h4 style="font-weight: bold; margin: 0; font-size: 18px;">${product.name}</h4>
                    <p style="margin: 0; font-size: 14px; color: #555;">Cantidad: ${count}</p>
                    <p style="font-weight: 600; margin: 0; font-size: 16px; color: #ffbf00;">$${product.price}</p>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h1 style="text-align: center; color: #ff8c00;">🛒 Resumen de tu Pedido</h1>
            <p style="text-align: center; color: #666;">Soluciones Delicias</p>
            <div style="margin-top: 30px;">
                ${itemsHtml}
            </div>
            <div style="margin-top: 20px; border-top: 2px solid #333; padding-top: 20px; display: flex; justify-content: space-between; font-weight: bold; font-size: 24px;">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>
    `;
}

function renderAdminProductList() {
    const productListContainer = document.getElementById('adminProductList');
    const tableContainer = document.getElementById('adminTableContainer');
    
    if (!productListContainer || !tableContainer) return;
    
    productListContainer.innerHTML = '';
    tableContainer.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th class="w-20">Imagen</th>
                <th>Producto</th>
                <th class="w-32">Precio</th>
                <th class="w-48 text-center">Acciones</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    const tableBody = table.querySelector('tbody');

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'bg-gray-700 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4';
        productItem.innerHTML = `
            <div class="flex-grow">
                <h4 class="font-bold text-white">${product.name}</h4>
                <p class="text-sm text-gray-400 truncate">${product.description}</p>
            </div>
            <div class="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 w-full md:w-auto">
                <button class="edit-btn btn-secondary w-full" data-id="${product.id}">Editar</button>
                <button class="delete-btn bg-red-500 text-white font-bold py-2 px-4 rounded-full hover:bg-red-600 w-full" data-id="${product.id}">Eliminar</button>
            </div>
        `;
        productListContainer.appendChild(productItem);

        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
            <td><img src="${product.imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e2e8f0/64748b?text=N/A'"></td>
            <td>
                <div class="font-bold text-white">${product.name}</div>
                <div class="text-sm text-gray-400">${product.description}</div>
            </td>
            <td class="font-semibold text-yellow-500">$${product.price.toFixed(2)}</td>
            <td>
                <div class="flex justify-center gap-2">
                    <button class="edit-btn btn-secondary" data-id="${product.id}">Editar</button>
                    <button class="delete-btn bg-red-500 text-white font-bold py-2 px-4 rounded-full hover:bg-red-600" data-id="${product.id}">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tableRow);
    });

    tableContainer.appendChild(table);

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit && productIdInput) {
                productIdInput.value = productToEdit.id;
                document.getElementById('productName').value = productToEdit.name;
                document.getElementById('productDescription').value = productToEdit.description;
                document.getElementById('productPrice').value = productToEdit.price;
                document.getElementById('productImage').value = productToEdit.imageUrl;
                if (submitBtn) submitBtn.textContent = 'Actualizar Producto';
                if (cancelBtn) cancelBtn.classList.remove('hidden');
                if (adminPanel) adminPanel.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = e.target.getAttribute('data-id');
            const confirmed = await showConfirm('¿Estás seguro de que quieres eliminar este producto?');
            if (confirmed && db) {
                try {
                    const productRef = ref(db, `/artifacts/${appId}/public/products/${productId}`);
                    await remove(productRef);
                    showMessage('Producto Eliminado', 'El producto ha sido eliminado.');
                } catch (error) {
                    console.error("Error al eliminar el producto: ", error);
                    showMessage('Error', 'No se pudo eliminar el producto. Inténtalo de nuevo.');
                }
            }
        });
    });
}

/**
 */
// En la función filterProducts, actualizar para manejar ambos buscadores
function filterProducts() {
    // Obtener el buscador activo según el modo
    const isAdminView = adminPanel && adminPanel.classList.contains('active');
    const searchInput = isAdminView ? 
        document.getElementById('adminSearchInput') : 
        document.getElementById('searchInput');
    
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    
    if (isAdminView) {
        // Lógica para filtrar en panel de administración
        const adminCards = document.querySelectorAll('#adminProductList > div');
        const adminTableRows = document.querySelectorAll('#adminTableContainer table tbody tr');
        
        adminCards.forEach(card => {
            const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
            const description = card.querySelector('p')?.textContent.toLowerCase() || '';
            card.style.display = (name.includes(query) || description.includes(query)) ? 'flex' : 'none';
        });
        
        adminTableRows.forEach(row => {
            const name = row.querySelector('td:nth-child(2) .font-bold')?.textContent.toLowerCase() || '';
            const description = row.querySelector('td:nth-child(2) .text-sm')?.textContent.toLowerCase() || '';
            row.style.display = (name.includes(query) || description.includes(query)) ? 'table-row' : 'none';
        });
    } else {
        // Lógica para filtrar el catálogo principal (vista de usuario)
        const filtered = products.filter(product => 
            product.name.toLowerCase().includes(query) || 
            product.description.toLowerCase().includes(query)
        );
        renderProducts(filtered);
    }
}

// Agregar event listener para el buscador de administración
document.addEventListener('DOMContentLoaded', function() {
    // Conectar ambos buscadores al evento de filtrado
    const clientSearchInput = document.getElementById('searchInput');
    const adminSearchInput = document.getElementById('adminSearchInput');
    
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', filterProducts);
    }
    
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', filterProducts);
    }
});
// === EVENT LISTENERS ===
if (closeMessageBtn) {
    closeMessageBtn.addEventListener('click', () => {
        if (messageBox) messageBox.style.display = 'none';
    });
}

if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterProducts();
        }
    });
}

const productModalClose = document.querySelector('#productModal .close-button');
if (productModalClose) {
    productModalClose.addEventListener('click', () => {
        if (productModal) productModal.style.display = 'none';
    });
}

if (printOrderBtn) {
    printOrderBtn.addEventListener('click', async () => {
        if (Object.keys(cart).length === 0) {
            showMessage('Carrito Vacío', 'No puedes guardar un pedido sin productos.');
            return;
        }
        
        try {
            // Generar ID único para el pedido
            const orderId = generatePrivateKey();
            const orderNumber = Math.floor(100000 + Math.random() * 900000);
            const total = calculateTotal();
            
            // Preparar datos temporales para la preview
            const orderPreviewData = {
                cart: {...cart},
                total: total,
                orderId: orderId,           // ← Asegurar que orderId esté incluido
                orderNumber: orderNumber
            };
            
            console.log("Preparando preview de pedido:", orderPreviewData);
            
            // REDIRIGIR A ORDER-PREVIEW CON TODOS LOS DATOS
            window.location.href = `order-preview.html?data=${encodeURIComponent(JSON.stringify(orderPreviewData))}`;
            
        } catch (error) {
            console.error("Error al preparar pedido:", error);
            showMessage('Error', 'No se pudo preparar el pedido. Intenta nuevamente.');
        }
    });
}

function calculateTotal() {
const productMap = {};
products.forEach(p => {
    productMap[p.id] = p;
}); 

return Object.keys(cart).reduce((total, id) => {
        const product = productMap[id];
        return product ? total + (product.price * cart[id]) : total;
    }, 0);
}

// Función para generar PDF localmente
function generateLocalPDF(orderData) {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pedido Local - Soluciones Delicias</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .product-item { display: flex; margin-bottom: 15px; }
                .product-item img { width: 80px; height: 80px; object-fit: cover; margin-right: 15px; }
                .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>🛒 Pedido Guardado Localmente</h1>
            <p>Este pedido se guardó localmente debido a problemas de conexión.</p>
            ${printContent}
            <p><strong>ID del pedido:</strong> local_${Date.now()}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Agrega la función para generar la clave privada en tu script.js
function generatePrivateKey() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            imageUrl: document.getElementById('productImage').value,
            timestamp: Date.now()
        };
        const productId = productIdInput.value;

        try {
            if (db) {
                if (productId) {
                    const productRef = ref(db, `/artifacts/${appId}/public/products/${productId}`);
                    await set(productRef, productData);
                    showMessage('Producto Actualizado', `El producto "${productData.name}" ha sido actualizado.`);
                } else {
                    const productsRef = ref(db, `/artifacts/${appId}/public/products`);
                    await push(productsRef, productData);
                    showMessage('Producto Agregado', `El producto "${productData.name}" ha sido agregado.`);
                }
                productForm.reset();
                if (productIdInput) productIdInput.value = '';
                if (submitBtn) submitBtn.textContent = 'Agregar Producto';
                if (cancelBtn) cancelBtn.classList.add('hidden');
            } else {
                showMessage('Error', 'Base de datos no disponible.');
            }
        } catch (error) {
            console.error("Error al guardar producto: ", error);
            showMessage('Error', 'No se pudo guardar el producto.');
        }
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        if (productForm) productForm.reset();
        if (productIdInput) productIdInput.value = '';
        if (submitBtn) submitBtn.textContent = 'Agregar Producto';
        cancelBtn.classList.add('hidden');
    });
}

if (openCartBtn) {
    openCartBtn.addEventListener('click', () => {
        if (cartPanel) cartPanel.classList.add('active');
    });
}

if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
        if (cartPanel) cartPanel.classList.remove('active');
    });
}

if (mainTitle) {
    mainTitle.addEventListener('click', () => {
        adminClicks++;
        if (adminClicks >= 5 && loginModal) {
            loginModal.style.display = 'flex';
            adminClicks = 0;
        }
    });
}

if (closeLoginModal) {
    closeLoginModal.addEventListener('click', () => {
        if (loginModal) loginModal.style.display = 'none';
    });
}

loginBtn.addEventListener('click', async () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log("=== VERIFICACIÓN ADMIN ===");
        console.log("UID usuario:", user.uid);
        console.log("Admins cargados:", admins);
        console.log("¿Es admin?", admins[user.uid]);
        
        if (admins[user.uid]) {
            loginModal.style.display = 'none';
            adminPanel.classList.add('active');
            
            // CARGAR PEDIDOS Y CONFIGURAR PESTAÑAS
            setupAdminOrdersListener();
            setupAdminTabs();
            
            renderAdminProductList();
            showMessage('¡Bienvenido!', 'Has iniciado sesión como administrador.');
            filterProducts();
        } else {
            await signOut(auth);
            showMessage('Acceso Denegado', 'No tienes permisos de administrador.');
        }
    } catch (error) {
        console.error("Error de inicio de sesión:", error);
        let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Correo o contraseña incorrectos.';
        }
        showMessage('Error de Autenticación', errorMessage);
    }
});

function renderOrdersList() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    const searchTerm = orderSearch ? orderSearch.value.toLowerCase() : '';
    
    const filteredOrders = orders.filter(order => 
        order.customerName?.toLowerCase().includes(searchTerm) ||
        order.customerPhone?.includes(searchTerm) ||
        order.orderNumber?.toString().includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm)
    );
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p class="text-center text-gray-500 py-8">No hay pedidos registrados</p>';
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        // Crear mapa de productos para este pedido
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p;
        });
        
        return `
        <div class="order-item bg-gray-700 p-4 rounded-xl mb-4">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-bold text-white">Pedido #${order.orderNumber || order.id.substring(0, 8)}</h4>
                    <p class="text-sm text-gray-400">${formatDate(order.timestamp)}</p>
                    <p class="text-sm text-gray-400">Cliente: ${order.customerName || 'No especificado'}</p>
                    <p class="text-sm text-gray-400">Teléfono: ${order.customerPhone || 'No especificado'}</p>
                </div>
                <span class="status-badge status-${order.status || 'pendiente'} px-3 py-1 rounded-full text-sm">
                    ${getOrderStatusText(order.status || 'pendiente')}
                </span>
            </div>
            
            <!-- SECCIÓN DE PRODUCTOS CON IMÁGENES -->
            <div class="mb-3">
                <p class="text-sm text-gray-400 mb-2">Productos:</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    ${Object.entries(order.cart || {}).map(([productId, quantity]) => {
                        const product = productMap[productId];
                        if (product) {
                            return `
                                <div class="flex items-center bg-gray-800 p-2 rounded-lg">
                                    <img src="${product.imageUrl}" 
                                         alt="${product.name}" 
                                         class="w-12 h-12 object-cover rounded-md mr-2"
                                         onerror="this.src='https://placehold.co/48x48/e2e8f0/64748b?text=Imagen'">
                                    <div class="flex-grow">
                                        <p class="text-sm text-white font-medium">${product.name}</p>
                                        <p class="text-xs text-gray-400">Cantidad: ${quantity}</p>
                                        <p class="text-xs text-yellow-400">$${product.price} c/u</p>
                                    </div>
                                    <span class="text-sm font-bold text-yellow-500">$${(product.price * quantity).toFixed(2)}</span>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="flex items-center bg-gray-800 p-2 rounded-lg">
                                    <div class="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center mr-2">
                                        <span class="text-gray-400 text-lg">❓</span>
                                    </div>
                                    <div class="flex-grow">
                                        <p class="text-sm text-gray-400">Producto no encontrado</p>
                                        <p class="text-xs text-gray-500">ID: ${productId.substring(0, 6)}...</p>
                                        <p class="text-xs text-gray-400">Cantidad: ${quantity}</p>
                                    </div>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
            
            <div class="flex justify-between items-center border-t border-gray-600 pt-3">
                <span class="text-lg font-bold text-white">Total: $${order.total?.toFixed(2) || '0.00'}</span>
                <div class="flex gap-2 flex-wrap">
                    <a href="order-preview.html?id=${order.id}" target="_blank" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                        Ver Detalles
                    </a>
                    <select class="status-select bg-gray-600 text-white p-1 rounded text-sm" data-order-id="${order.id}">
                        <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                        <option value="preparando" ${order.status === 'preparando' ? 'selected' : ''}>Preparando</option>
                        <option value="en_camino" ${order.status === 'en_camino' ? 'selected' : ''}>En camino</option>
                        <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                    <button class="delete-order-btn bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" data-order-id="${order.id}">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // 🔥 IMPORTANTE: Reconectar los event listeners después de renderizar
    reconnectOrderEventListeners();
}

// 🔥 NUEVA FUNCIÓN: Reconectar event listeners
function reconnectOrderEventListeners() {
    // Agregar event listeners a los selects de estado
    document.querySelectorAll('.status-select').forEach(select => {
        // Remover event listeners existentes primero para evitar duplicados
        select.replaceWith(select.cloneNode(true));
    });
    
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.getAttribute('data-order-id');
            const newStatus = e.target.value;
            
            try {
                if (db) {
                    const orderRef = ref(db, `/artifacts/${appId}/public/orders/${orderId}`);
                    await update(orderRef, {
                        status: newStatus,
                        lastUpdated: Date.now()
                    });
                    
                    showMessage('Estado actualizado', `El estado del pedido se actualizó a: ${getOrderStatusText(newStatus)}`);
                    
                    // Actualizar visualmente el badge de estado
                    const badge = e.target.closest('.order-item').querySelector('.status-badge');
                    if (badge) {
                        badge.className = `status-badge status-${newStatus} px-3 py-1 rounded-full text-sm`;
                        badge.textContent = getOrderStatusText(newStatus);
                    }
                    
                } else {
                    showMessage('Error', 'Base de datos no disponible');
                }
            } catch (error) {
                console.error("Error al actualizar estado:", error);
                showMessage('Error', 'No se pudo actualizar el estado del pedido');
                // Revertir el select al valor anterior
                e.target.value = e.target.getAttribute('data-previous-value');
            }
        });
    });

    // AGREGAR EVENT LISTENERS PARA BOTONES ELIMINAR
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        // Remover event listeners existentes primero
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.getAttribute('data-order-id');
            const orderToDelete = orders.find(o => o.id === orderId);
            
            if (orderToDelete) {
                const confirmed = await showConfirm(
                    `¿Estás seguro de eliminar el pedido #${orderToDelete.orderNumber || orderId.substring(0, 8)}? Esta acción no se puede deshacer.`
                );
                
                if (confirmed) {
                    try {
                        const orderRef = ref(db, `/artifacts/${appId}/public/orders/${orderId}`);
                        await remove(orderRef);
                        showMessage('Pedido Eliminado', 'El pedido ha sido eliminado correctamente.');
                        
                        // Remover el pedido de la vista
                        e.target.closest('.order-item').remove();
                        
                    } catch (error) {
                        console.error("Error al eliminar pedido:", error);
                        showMessage('Error', 'No se pudo eliminar el pedido. Inténtalo de nuevo.');
                    }
                }
            }
        });
    });
}


function showOrderDetailsModal(order) {
    const modal = document.getElementById('orderDetailsModal');
    const content = document.getElementById('orderDetailsContent');
    if (!modal || !content) return;

    // Crea un mapa de productos para una búsqueda rápida por ID
    const productMap = products.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
    }, {});

    let itemsHtml = Object.entries(order.cart).map(([id, quantity]) => {
        // Busca el producto en el mapa usando el ID del carrito
        const product = productMap[id];
        
        // Si el producto no se encuentra, muestra un mensaje de error
        if (!product) {
            return `
                <li class="p-3 bg-gray-800 rounded-lg flex items-center gap-4">
                    <img src="https://via.placeholder.com/64" alt="No disponible" class="w-12 h-12 object-cover rounded-md">
                    <div class="flex-grow">
                        <h4 class="text-sm font-bold text-red-400">⚠️ Producto no encontrado</h4>
                        <p class="text-xs text-gray-400">ID: ${id}</p>
                    </div>
                </li>
            `;
        }
        
        // Si se encuentra, muestra la información y la imagen
        return `
            <li class="p-3 bg-gray-800 rounded-lg flex items-center gap-4">
                <img src="${product.imageUrl}" alt="${product.name}" class="w-12 h-12 object-cover rounded-md" onerror="this.onerror=null;this.src='https://via.placeholder.com/64'">
                <div class="flex-grow">
                    <h4 class="text-sm font-bold">${product.name}</h4>
                    <p class="text-xs text-gray-400">Cantidad: ${quantity}</p>
                </div>
                <span class="font-bold text-yellow-500">$${(product.price * quantity).toFixed(2)}</span>
            </li>
        `;
    }).join('');

    content.innerHTML = `
        <h3 class="text-2xl font-bold mb-4">Pedido #${order.orderNumber}</h3>
        <p class="text-sm text-gray-400 mb-2">Cliente: ${order.customerName}</p>
        <p class="text-sm text-gray-400 mb-4">Fecha: ${new Date(order.timestamp).toLocaleString()}</p>
        <div class="mb-4">
            <span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
        </div>
        <ul class="space-y-2 mb-4">
            ${itemsHtml}
        </ul>
        <div class="flex justify-between font-bold text-lg border-t border-gray-700 pt-4 mt-4">
            <span>Total:</span>
            <span>$${order.total.toFixed(2)}</span>
        </div>
        <button id="closeOrderDetailsBtn" class="mt-4 w-full btn-secondary">Cerrar</button>
    `;
    modal.style.display = 'flex';
    document.getElementById('closeOrderDetailsBtn').onclick = () => modal.style.display = 'none';
}


function formatDate(timestamp) {
    if (!timestamp) return 'Fecha no disponible';
    return new Date(timestamp).toLocaleString('es-ES');
}

function getOrderStatusText(status) {
    const statusMap = {
        'pendiente': '⏳ Pendiente',
        'confirmado': '✅ Confirmado',
        'preparando': '👨‍🍳 Preparando',
        'en_camino': '🚚 En camino',
        'entregado': '📦 Entregado',
        'cancelado': '❌ Cancelado'
    };
    return statusMap[status] || status;
}

function setupAdminTabs() {
    ordersTab = document.getElementById('ordersTab');
    productsTab = document.getElementById('productsTab');
    ordersContent = document.getElementById('ordersContent');
    productsContent = document.getElementById('productsContent');
    orderSearch = document.getElementById('orderSearch');
    
    if (ordersTab && productsTab && ordersContent && productsContent) {
        // Configurar pestaña de productos
        productsTab.addEventListener('click', () => {
            productsTab.classList.add('text-white', 'border-b-2', 'border-yellow-500');
            productsTab.classList.remove('text-gray-400');
            ordersTab.classList.remove('text-white', 'border-b-2', 'border-yellow-500');
            ordersTab.classList.add('text-gray-400');
            productsContent.classList.remove('hidden');
            ordersContent.classList.add('hidden');
        });
        
        // Configurar pestaña de pedidos
        ordersTab.addEventListener('click', () => {
            ordersTab.classList.add('text-white', 'border-b-2', 'border-yellow-500');
            ordersTab.classList.remove('text-gray-400');
            productsTab.classList.remove('text-white', 'border-b-2', 'border-yellow-500');
            productsTab.classList.add('text-gray-400');
            ordersContent.classList.remove('hidden');
            productsContent.classList.add('hidden');
            
            // Asegurarse de que los pedidos estén cargados
            if (orders.length === 0 && auth.currentUser && admins[auth.currentUser.uid]) {
                setupAdminOrdersListener();
            }
        });
        
        if (orderSearch) {
            orderSearch.addEventListener('input', renderOrdersList);
        }
        
        console.log("Pestañas de administrador configuradas correctamente");
    } else {
        console.error("No se encontraron todos los elementos de las pestañas");
    }
}

// NUEVA FUNCIONALIDAD: Función para cerrar sesión
function logout() {
    if (!auth) {
        console.error("Auth no inicializado, no se puede cerrar sesión.");
        return;
    }
    signOut(auth).then(() => {
        console.log("Sesión cerrada exitosamente. Redirigiendo...");
        window.location.href = 'index.html'; // Redirige a la página principal
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
        showMessage('Error', 'No se pudo cerrar la sesión.');
    });
}
// NUEVA FUNCIONALIDAD: Event listener para el botón de cerrar sesión
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}


document.addEventListener('DOMContentLoaded', function() {
    // Conectar ambos buscadores al evento de filtrado
    const clientSearchInput = document.getElementById('searchInput');
    const adminSearchInput = document.getElementById('adminSearchInput');
    
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', filterProducts);
    }
    
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', filterProducts);
    }
});
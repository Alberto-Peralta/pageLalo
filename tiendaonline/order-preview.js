// order-preview.js - Versión con sistema de estados
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, get, update, remove } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBChsbH9IyHGVGlH0Gg05pyTchM_kuJLrE",
    authDomain: "soluciones-c5d76.firebaseapp.com",
    databaseURL: "https://soluciones-c5d76-default-rtdb.firebaseio.com",
    projectId: "soluciones-c5d76",
    storageBucket: "soluciones-c5d76.firebasestorage.app",
    messagingSenderId: "126602231797",
    appId: "1:126602231797:web:f91f0bd6c9f97243186abc"
};

const appId = "default-app-id";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Elementos del DOM
const loadingMessage = document.getElementById('loading-message');
const orderDetailsContainer = document.getElementById('order-details-container');
const productListDiv = document.getElementById('product-list');
const orderTotalSpan = document.getElementById('order-total');
const printBtn = document.getElementById('printBtn');
const editButtonsContainer = document.createElement('div');

// Variables globales
let orderId;
let orderData;
let allProducts = {};
let isEditMode = false;

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('id');

    if (!orderId) {
        showError('Error: Falta el ID del pedido en la URL.');
        return;
    }

    try {
        loadingMessage.textContent = 'Cargando pedido...';
        
        // Intentar cargar desde Firebase
        const orderRef = ref(db, `artifacts/${appId}/public/orders/${orderId}`);
        const orderSnapshot = await get(orderRef);

        if (!orderSnapshot.exists()) {
            showError('Error: Pedido no encontrado.');
            return;
        }

        orderData = orderSnapshot.val();
        
        // Cargar productos
        const productsRef = ref(db, `artifacts/${appId}/public/products`);
        const productsSnapshot = await get(productsRef);
        allProducts = productsSnapshot.val() || {};

        displayOrder(orderData, allProducts);
        setupEditButtons();

    } catch (error) {
        console.error("Error al cargar el pedido:", error);
        showError('Error: No se pudo cargar el pedido. Verifica tu conexión.');
    }
}

function displayOrder(orderData, allProducts) {
    let total = 0;
    productListDiv.innerHTML = '';
    
    // Mostrar información del pedido - usar let en lugar de const
    let orderInfoHtml = `
        <div class="order-info bg-gray-800 p-4 rounded-xl mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                <div>
                    <p class="text-sm text-gray-400">Número de Pedido</p>
                    <p class="font-bold">#${orderData.orderNumber || orderId.substring(0, 8)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-400">Cliente</p>
                    <p class="font-bold">${orderData.customerName || 'Cliente'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-400">Teléfono</p>
                    <p class="font-bold">${orderData.customerPhone || 'Sin teléfono'}</p>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-400">Estado del Pedido</p>
                <div class="status-indicator flex items-center mt-2">
                    <span class="status-badge status-${orderData.status || 'pendiente'} px-3 py-1 rounded-full text-sm font-bold">
                        ${getStatusText(orderData.status || 'pendiente')}
                    </span>
    `;


                // Ocultar botón de confirmar si el pedido ya está confirmado o en estado posterior
            setTimeout(() => {
                const confirmBtn = document.getElementById('confirmOrderBtn');
                if (confirmBtn && orderData.status && orderData.status !== 'pendiente') {
                    confirmBtn.style.display = 'none';
                }
            }, 100);
    
    // Agregar controles de admin si es necesario
    if (isAdmin) {
        orderInfoHtml += `
                    <select id="statusSelect" class="ml-4 bg-gray-700 text-white p-1 rounded">
                        <option value="pendiente" ${(orderData.status || 'pendiente') === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="confirmado" ${(orderData.status || 'pendiente') === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                        <option value="preparando" ${(orderData.status || 'pendiente') === 'preparando' ? 'selected' : ''}>En preparación</option>
                        <option value="en_camino" ${(orderData.status || 'pendiente') === 'en_camino' ? 'selected' : ''}>En camino</option>
                        <option value="entregado" ${(orderData.status || 'pendiente') === 'entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelado" ${(orderData.status || 'pendiente') === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                    <button id="updateStatusBtn" class="ml-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
                        Actualizar
                    </button>
        `;
    }
    
    orderInfoHtml += `
                </div>
            </div>
        </div>
    `;
    
    productListDiv.innerHTML = orderInfoHtml;
    
    // Resto del código permanece igual...
    // Mostrar productos
    for (const productId in orderData.cart) {
        const count = orderData.cart[productId];
        const product = allProducts[productId];
        
        if (product) {
            total += product.price * count;
            const itemHtml = `
                <div class="product-item" data-product-id="${productId}">
                    <img src="${product.imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/80x80?text=N/A'">
                    <div class="flex-grow">
                        <h4 class="font-bold text-white">${product.name}</h4>
                        <p class="text-sm text-gray-400">Cantidad: ${count}</p>
                        <p class="font-semibold text-yellow-500">$${product.price.toFixed(2)}</p>
                    </div>
                    ${isEditMode ? `
                    <div class="edit-controls flex items-center gap-2 ml-4">
                        <button class="decrease-btn bg-red-500 text-white p-1 rounded hover:bg-red-600" data-product-id="${productId}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                            </svg>
                        </button>
                        <span class="quantity-display bg-gray-700 px-2 py-1 rounded min-w-[2rem] text-center">${count}</span>
                        <button class="increase-btn bg-green-500 text-white p-1 rounded hover:bg-green-600" data-product-id="${productId}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>
                        <button class="remove-btn bg-red-600 text-white p-1 rounded hover:bg-red-700 ml-2" data-product-id="${productId}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;
            productListDiv.innerHTML += itemHtml;
        }
    }
    
    orderTotalSpan.textContent = `$${total.toFixed(2)}`;
    loadingMessage.style.display = 'none';
    orderDetailsContainer.classList.remove('hidden');

    // Agregar event listener para actualizar estado si es admin
    if (isAdmin) {
        setTimeout(() => {
            const updateBtn = document.getElementById('updateStatusBtn');
            if (updateBtn) {
                updateBtn.addEventListener('click', updateOrderStatus);
            }
        }, 100);
    }

    printBtn.addEventListener('click', () => {
        window.print();
    });
}

// Función simplificada para verificar si es admin (por ahora)
let isAdmin = false;
async function checkAdminStatus() {
    try {
        const user = auth.currentUser;
        if (!user) {
            isAdmin = false;
            return;
        }
        
        const adminsRef = ref(db, 'admins');
        const snapshot = await get(adminsRef);
        const admins = snapshot.val() || {};
        
        isAdmin = admins[user.uid] === true;
    } catch (error) {
        console.error("Error verificando admin:", error);
        isAdmin = false;
    }
}

// Función para obtener texto del estado
function getStatusText(status) {
    const statusMap = {
        'pendiente': '⏳ Pendiente',
        'confirmado': '✅ Confirmado',
        'preparando': '👨‍🍳 En preparación',
        'en_camino': '🚚 En camino',
        'entregado': '📦 Entregado',
        'cancelado': '❌ Cancelado'
    };
    return statusMap[status] || status;
}

// Función para actualizar estado
async function updateOrderStatus() {
    try {
        const newStatus = document.getElementById('statusSelect').value;
        const orderRef = ref(db, `artifacts/${appId}/public/orders/${orderId}`);
        
        await update(orderRef, {
            status: newStatus,
            lastUpdated: Date.now()
        });
        
        alert('✅ Estado actualizado correctamente');
        
        // Actualizar visualmente
        const badge = document.querySelector('.status-badge');
        badge.className = `status-badge status-${newStatus} px-3 py-1 rounded-full text-sm font-bold`;
        badge.textContent = getStatusText(newStatus);
        
        // Ocultar botón de confirmar si el estado ya no es pendiente
        const confirmBtn = document.getElementById('confirmOrderBtn');
        if (confirmBtn && newStatus !== 'pendiente') {
            confirmBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        alert('❌ Error al actualizar el estado');
    }
}

function setupEditButtons() {
    // Crear contenedor de botones de acción
    editButtonsContainer.className = 'flex flex-wrap gap-4 mt-6 no-print';
    
    // Botones base para todos los usuarios
    let buttonsHtml = `
        <button id="confirmOrderBtn" class="bg-green-600 text-white font-bold py-2 px-6 rounded-full hover:bg-green-700 transition-colors">
            ✅ Confirmar Pedido
        </button>
        <button id="whatsappOrderBtn" class="whatsapp-button font-bold py-2 px-6 rounded-full transition-colors flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.864 3.488"/>
            </svg>
            WhatsApp
        </button>
    `;
    
    // Agregar botones de admin solo si es administrador
    if (isAdmin) {
        buttonsHtml += `
            <button id="editOrderBtn" class="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors">
                ✏️ Editar Pedido
            </button>
            <button id="cancelOrderBtn" class="bg-red-500 text-white font-bold py-2 px-6 rounded-full hover:bg-red-600 transition-colors">
                🗑️ Cancelar Pedido
            </button>
            <div id="editModeControls" class="hidden flex gap-4">
                <button id="saveChangesBtn" class="bg-green-500 text-white font-bold py-2 px-6 rounded-full hover:bg-green-600 transition-colors">
                    💾 Guardar
                </button>
                <button id="cancelEditBtn" class="bg-gray-500 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-600 transition-colors">
                    ❌ Cancelar
                </button>
            </div>
        `;
    }
    
    editButtonsContainer.innerHTML = buttonsHtml;
    orderDetailsContainer.appendChild(editButtonsContainer);

    // Event listeners para los botones
    document.getElementById('confirmOrderBtn').addEventListener('click', confirmOrder);
    document.getElementById('whatsappOrderBtn').addEventListener('click', sendWhatsAppMessage);
    
    if (isAdmin) {
        document.getElementById('editOrderBtn').addEventListener('click', enableEditMode);
        document.getElementById('cancelOrderBtn').addEventListener('click', confirmCancelOrder);
        document.getElementById('saveChangesBtn').addEventListener('click', saveChanges);
        document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
    }
}

function sendWhatsAppMessage() {
    const phoneNumber = '6393992678';
    
    let message = '¡Hola! Tengo un pedido con los siguientes productos:\n\n';
    let total = 0;
    
    for (const productId in orderData.cart) {
        const count = orderData.cart[productId];
        const product = allProducts[productId];
        if (product) {
            const subtotal = product.price * count;
            total += subtotal;
            message += `• ${product.name} x ${count} = $${subtotal.toFixed(2)}\n`;
        }
    }
    
    message += `\n💰 Total: $${total.toFixed(2)}`;
    message += `\n\n📋 ID del Pedido: ${orderId}`;
    message += `\n\n¡Gracias!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

function enableEditMode() {
    isEditMode = true;
    document.getElementById('editOrderBtn').classList.add('hidden');
    document.getElementById('cancelOrderBtn').classList.add('hidden');
    document.getElementById('editModeControls').classList.remove('hidden');
    
    // Volver a mostrar el pedido con controles de edición
    displayOrder(orderData, allProducts);
    
    // Agregar event listeners a los botones de edición
    setTimeout(() => {
        document.querySelectorAll('.increase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').getAttribute('data-product-id');
                increaseQuantity(productId);
            });
        });

        document.querySelectorAll('.decrease-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').getAttribute('data-product-id');
                decreaseQuantity(productId);
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').getAttribute('data-product-id');
                removeProduct(productId);
            });
        });
    }, 100);
}

function increaseQuantity(productId) {
    orderData.cart[productId] = (orderData.cart[productId] || 0) + 1;
    updateQuantityDisplay(productId);
    updateTotal();
}

function decreaseQuantity(productId) {
    if (orderData.cart[productId] > 1) {
        orderData.cart[productId] -= 1;
        updateQuantityDisplay(productId);
        updateTotal();
    }
}

function removeProduct(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto del pedido?')) {
        delete orderData.cart[productId];
        const productElement = document.querySelector(`.product-item[data-product-id="${productId}"]`);
        if (productElement) {
            productElement.remove();
        }
        updateTotal();
        
        if (Object.keys(orderData.cart).length === 0) {
            if (confirm('No hay productos en el pedido. ¿Quieres cancelar el pedido completo?')) {
                cancelOrder();
            }
        }
    }
}

function updateQuantityDisplay(productId) {
    const quantityDisplay = document.querySelector(`.product-item[data-product-id="${productId}"] .quantity-display`);
    if (quantityDisplay) {
        quantityDisplay.textContent = orderData.cart[productId];
    }
}

function updateTotal() {
    let total = 0;
    for (const productId in orderData.cart) {
        const product = allProducts[productId];
        if (product) {
            total += product.price * orderData.cart[productId];
        }
    }
    orderTotalSpan.textContent = `$${total.toFixed(2)}`;
}

async function saveChanges() {
    try {
        const orderRef = ref(db, `artifacts/${appId}/public/orders/${orderId}`);
        await update(orderRef, {
            cart: orderData.cart,
            lastUpdated: Date.now()
        });
        
        alert('✅ Cambios guardados correctamente');
        disableEditMode();
        window.location.reload();
        
    } catch (error) {
        console.error("Error al guardar cambios:", error);
        alert('❌ Error al guardar los cambios. Intenta nuevamente.');
    }
}

function cancelEdit() {
    if (confirm('¿Descartar todos los cambios?')) {
        disableEditMode();
        window.location.reload();
    }
}

function disableEditMode() {
    isEditMode = false;
    document.getElementById('editOrderBtn').classList.remove('hidden');
    document.getElementById('cancelOrderBtn').classList.remove('hidden');
    document.getElementById('editModeControls').classList.add('hidden');
}

function confirmCancelOrder() {
    if (confirm('¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.')) {
        cancelOrder();
    }
}

async function cancelOrder() {
    try {
        const orderRef = ref(db, `artifacts/${appId}/public/orders/${orderId}`);
        await remove(orderRef);
        
        alert('✅ Pedido cancelado correctamente');
        orderDetailsContainer.innerHTML = `
            <div class="text-center py-10">
                <div class="text-red-500 text-6xl mb-4">❌</div>
                <h2 class="text-2xl font-bold text-white mb-2">Pedido Cancelado</h2>
                <p class="text-gray-400">Este pedido ha sido cancelado exitosamente.</p>
                <a href="index.html" class="mt-4 inline-block bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600">
                    Volver al Catálogo
                </a>
            </div>
        `;
        
    } catch (error) {
        console.error("Error al cancelar pedido:", error);
        alert('❌ Error al cancelar el pedido. Intenta nuevamente.');
    }
}

// En order-preview.html
// En order-preview.html - Función mejorada
async function confirmOrder() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const previewData = urlParams.get('data');
        
        if (!previewData) {
            console.error('Error: No hay datos del pedido. Vuelve a intentarlo.');
            // En lugar de alert, redirigimos
            window.location.href = 'index.html';
            return;
        }
        
        const orderData = JSON.parse(decodeURIComponent(previewData));
        
        // CORRECCIÓN: Usamos un modal o formulario en el HTML para pedir los datos del cliente,
        // ya que prompt() no funciona. Por ahora, usamos datos de prueba.
        const customerName = 'Nombre del Cliente'; // Reemplazar con datos de un formulario
        const customerPhone = '521234567890'; // Reemplazar con datos de un formulario

        if (!customerName.trim() || !customerPhone.trim()) {
            console.error('Nombre y teléfono son requeridos para confirmar el pedido.');
            return;
        }
        
        // Datos completos del pedido
        const completeOrderData = {
            ...orderData, // Copia todos los datos existentes
            timestamp: Date.now(),
            status: 'pendiente',
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
        };
        
        // Asumiendo que `app` y `db` ya están inicializados globalmente
        const orderRef = ref(db, `/artifacts/${appId}/public/orders/${orderData.orderId}`);
        await set(orderRef, completeOrderData);
        
        // Construir el mensaje de WhatsApp CON el ID del pedido
        const whatsappMessage = `¡Hola ${customerName}! 👋\n\n` +
                                `✅ Tu pedido en *El cielo en tus manos* ha sido registrado.\n` +
                                `📦 *Número de pedido:* ${orderData.orderNumber}\n` +
                                `💰 *Total:* $${orderData.total.toFixed(2)}\n\n` +
                                `🔍 *Sigue el estado de tu pedido aquí:*\n` +
                                `${window.location.origin}/order-status.html?id=${orderData.orderId}\n\n` +
                                `¡Gracias por tu compra! 🙏`;
                                
        // Generar la URL de WhatsApp
        const whatsappUrl = `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Abrir la URL en una nueva pestaña
        window.open(whatsappUrl, '_blank');
        
        // CORRECCIÓN: Redirigir a la página de estado con el ID del pedido
        window.location.href = `order-status.html?id=${orderData.orderId}`;
        
    } catch (error) {
        console.error("Error al confirmar pedido:", error);
        // En lugar de alert, mostramos un error en la consola
    }
}
// Botón en order-preview.html
// <button onclick="confirmOrder()" class="btn-primary">✅ Confirmar Pedido y Enviar WhatsApp</button>

function showError(message) {
    loadingMessage.textContent = message;
    loadingMessage.classList.add('text-red-500');
}

// Estilos adicionales
const style = document.createElement('style');
style.textContent = `
    .text-red-500 { color: #ef4444; }
    .hidden { display: none; }
    .product-item { transition: all 0.3s ease; }
    .edit-controls { transition: opacity 0.3s ease; }
    .quantity-display { min-width: 2rem; }
    .status-pendiente { background-color: #f59e0b; color: white; }
    .status-confirmado { background-color: #10b981; color: white; }
    .status-preparando { background-color: #3b82f6; color: white; }
    .status-en_camino { background-color: #8b5cf6; color: white; }
    .status-entregado { background-color: #059669; color: white; }
    .status-cancelado { background-color: #ef4444; color: white; }
    .order-info { border-left: 4px solid #3b82f6; }
    .status-badge { transition: all 0.3s ease; }
`;
document.head.appendChild(style);

// Iniciar
checkAdminStatus().then(() => {
    init();
});
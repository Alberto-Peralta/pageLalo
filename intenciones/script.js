// Importa los módulos necesarios de Firebase para la versión modular (v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Funciones globales para manejar el estado del UI
function showMessageModal(message) {
    const modal = document.getElementById('message-modal');
    const modalText = document.getElementById('modal-text');
    if (modal && modalText) {
        modalText.textContent = message;
        modal.style.display = 'flex';
    }
}

// Variables globales proporcionadas por el entorno de Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicialización de Firebase
let db;
let auth;
let userId;

async function initializeFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Autentica al usuario usando el token proporcionado
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            // Si no hay token, usa autenticación anónima
            await signInAnonymously(auth);
        }

        // Usa onAuthStateChanged para obtener el usuario actual de forma segura
        auth.onAuthStateChanged(user => {
            if (user) {
                userId = user.uid;
                document.getElementById('user-info').textContent = `Tu ID de usuario es: ${userId}`;
                // Cargar las intenciones solo después de la autenticación
                fetchIntentions();
            } else {
                console.log("Usuario no autenticado. Usando ID anónimo.");
                userId = crypto.randomUUID();
                document.getElementById('user-info').textContent = `ID Anónimo: ${userId}`;
                // Cargar intenciones incluso para usuarios anónimos
                fetchIntentions();
            }
        });

    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        document.getElementById('loading-message').textContent = 'Error al cargar. Revisa la consola para más detalles.';
        showMessageModal(`Error: ${error.message}`);
    }
}

// Lógica para enviar una nueva intención a Firestore
function setupFormSubmission() {
    const intentionForm = document.getElementById('intention-form');
    const intentionText = document.getElementById('intention-text');
    
    if (intentionForm) {
        intentionForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página se recargue
            const text = intentionText.value.trim();

            if (text) {
                try {
                    const intentionsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'intenciones');
                    await addDoc(intentionsCollectionRef, {
                        text: text,
                        userId: userId, // Guarda el ID del usuario
                        timestamp: new Date()
                    });
                    intentionText.value = ''; // Limpia el área de texto
                } catch (error) {
                    console.error("Error al guardar la intención:", error);
                    showMessageModal(`Error: ${error.message}. No se pudo enviar la intención.`);
                }
            }
        });
    }
}

// Lógica para leer las intenciones de Firestore en tiempo real
function fetchIntentions() {
    const intentionsList = document.getElementById('intentions-list');
    if (!db || !intentionsList) {
        return; // Salir si la base de datos o la lista no están listas
    }
    
    // Esconder el mensaje de carga
    document.getElementById('loading-message').style.display = 'none';

    try {
        const intentionsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'intenciones');
        const q = query(intentionsCollectionRef, orderBy('timestamp', 'desc'));

        onSnapshot(q, (snapshot) => {
            intentionsList.innerHTML = ''; // Limpia la lista actual
            if (snapshot.empty) {
                intentionsList.innerHTML = '<p>Todavía no hay intenciones. ¡Sé el primero en enviar una!</p>';
            } else {
                snapshot.forEach((doc) => {
                    const intention = doc.data();
                    const item = document.createElement('div');
                    item.className = 'intention-item p-4 bg-white rounded-lg shadow-sm mb-2';
                    item.innerHTML = `
                        <p class="text-gray-800 text-lg font-medium mb-1">"${intention.text}"</p>
                        <small class="text-gray-500">Por usuario: ${intention.userId}</small>
                    `;
                    intentionsList.appendChild(item);
                });
            }
        });
    } catch (error) {
        console.error('Error al cargar las intenciones:', error);
        intentionsList.innerHTML = '<p class="text-red-500">Lo sentimos, no pudimos cargar las intenciones. Intenta de nuevo más tarde.</p>';
    }
}

// Inicia el proceso de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    setupFormSubmission();
});

// Función para mostrar u ocultar el menú en dispositivos móviles (función original)
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

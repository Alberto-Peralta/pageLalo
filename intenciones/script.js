// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Application variables
let db;
let auth;
let userId = null;

// Get DOM elements
const intentionForm = document.getElementById('intention-form');
const intentionText = document.getElementById('intention-text');
const intentionsList = document.getElementById('intentions-list');
const userInfo = document.getElementById('user-info');
const loadingMessage = document.getElementById('loading-message');
const messageModal = document.getElementById('message-modal');
const modalText = document.getElementById('modal-text');

/**
 * Displays a message in a custom modal instead of using alert().
 * @param {string} message The message to display.
 */
function showMessage(message) {
    modalText.textContent = message;
    messageModal.style.display = 'flex';
}

/**
 * Initializes Firebase and authenticates the user.
 */
async function initializeFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Listen for authentication state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                console.log("Authentication successful. UID:", userId);
                userInfo.textContent = `ID de usuario: ${userId}`;
                setupRealtimeListener();
            } else {
                // Sign in using the custom token if available, otherwise sign in anonymously
                if (initialAuthToken) {
                    console.log("Signing in with custom token...");
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    console.log("Signing in anonymously...");
                    await signInAnonymously(auth);
                }
            }
        });
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showMessage(`Error al inicializar la aplicación: ${error.message}`);
    }
}

/**
 * Sets up a real-time listener for prayer intentions.
 */
function setupRealtimeListener() {
    if (!db || !userId) {
        console.error("Firebase not initialized or user not authenticated.");
        return;
    }

    const publicCollectionPath = `artifacts/${appId}/public/data/intentions`;
    const intentionsQuery = query(collection(db, publicCollectionPath), orderBy("timestamp", "desc"));

    onSnapshot(intentionsQuery, (snapshot) => {
        loadingMessage.classList.add('hidden');
        intentionsList.innerHTML = '';
        if (snapshot.empty) {
            intentionsList.innerHTML = '<p class="text-center text-gray-500">Todavía no hay intenciones. ¡Sé el primero en enviar una!</p>';
        } else {
            snapshot.forEach((doc) => {
                const intentionData = doc.data();
                const intentionId = doc.id;
                const item = document.createElement('div');
                item.className = 'intention-item p-4 bg-white rounded-lg shadow-sm flex justify-between items-center';
                item.innerHTML = `
                    <p class="flex-grow text-[#5c3a00]">${intentionData.text}</p>
                    ${(intentionData.userId === userId) ? `
                        <button data-id="${intentionId}" class="delete-btn bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded-full text-xs ml-4 transition-colors duration-300">
                            Borrar
                        </button>
                    ` : ''}
                `;
                intentionsList.appendChild(item);
            });

            // Add event listeners to the new delete buttons
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const intentionId = e.target.getAttribute('data-id');
                    deleteIntention(intentionId);
                });
            });
        }
    }, (error) => {
        console.error("Error getting real-time intentions:", error);
        showMessage("Error al cargar las intenciones. Por favor, revisa la consola para más detalles.");
    });
}

/**
 * Adds a new intention to Firestore.
 * @param {string} text The intention text to add.
 */
async function addIntention(text) {
    if (!db || !userId) {
        showMessage("La aplicación no está lista. Por favor, espera y vuelve a intentarlo.");
        return;
    }
    try {
        const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/intentions`), {
            text: text,
            timestamp: new Date(),
            userId: userId // Save the user's ID who created it
        });
        console.log("Intention sent with ID:", docRef.id);
        intentionText.value = '';
        showMessage("¡Tu intención ha sido enviada con éxito!");
    } catch (error) {
        console.error("Error adding intention:", error);
        showMessage(`Error al enviar la intención: ${error.message}`);
    }
}

/**
 * Deletes an intention from Firestore.
 * @param {string} id The ID of the intention to delete.
 */
async function deleteIntention(id) {
    if (!db || !userId) {
        showMessage("La aplicación no está lista. Por favor, espera y vuelve a intentarlo.");
        return;
    }
    try {
        // Only allow the user to delete their own intention
        const intentionDocRef = doc(db, `artifacts/${appId}/public/data/intentions`, id);
        await deleteDoc(intentionDocRef);
        showMessage("Intención borrada con éxito.");
    } catch (error) {
        console.error("Error deleting intention:", error);
        showMessage(`Error al borrar la intención: ${error.message}`);
    }
}

// Form submission handler
intentionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = intentionText.value.trim();
    if (text) {
        addIntention(text);
    }
});

// Start the application when the page loads
initializeFirebase();

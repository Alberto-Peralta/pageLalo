// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
    authDomain: "pagelalo-1b210.firebaseapp.com",
    projectId: "pagelalo-1b210",
    storageBucket: "pagelalo-1b210.firebasestorage.app",
    messagingSenderId: "1096735980204",
    appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const intentionsRef = database.ref('intenciones');

// UIDs de los administradores.
const adminUIDs = ["xqhClOg845dSU5XIu4vqTCy4XAj2", "UbR2AIirbiNH7uCXfl5P7rSWpIB2"];

document.addEventListener('DOMContentLoaded', () => {
    const intentionForm = document.getElementById('intention-form');
    const intentionText = document.getElementById('intention-text');
    const intentionsList = document.getElementById('intentions-list');
    
    // Elementos del modal de edición
    const editModal = document.getElementById('edit-modal');
    const editTextarea = document.getElementById('edit-text');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const closeBtn = document.querySelector('.close-btn');
    let currentKey = null; // Variable para guardar la clave de la intención a editar

    // Iniciar sesión de forma anónima
    auth.signInAnonymously().catch(error => {
        console.error("Error al autenticar anónimamente:", error);
    });

    // Muestra las intenciones en la página principal
    intentionsRef.on('value', (snapshot) => {
        const intentions = snapshot.val();
        intentionsList.innerHTML = '';
        if (intentions) {
            Object.keys(intentions).reverse().forEach(key => {
                const intention = intentions[key];
                const item = document.createElement('div');
                item.classList.add('intention-item');
                item.innerHTML = `
                    <p>${intention.text}</p>
                    <div class="intention-meta">
                        <span>${new Date(intention.timestamp).toLocaleDateString()}</span>
                        ${auth.currentUser && auth.currentUser.uid === intention.uid ? `<button class="delete-btn" data-key="${key}">Borrar</button>` : ''}
                    </div>
                `;
                intentionsList.appendChild(item);
            });
        }
    });

    // Envía la intención a Firebase
    intentionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = intentionText.value.trim();
        if (text !== '') {
            const newIntentionRef = intentionsRef.push();
            newIntentionRef.set({
                text: text,
                timestamp: Date.now(),
                uid: auth.currentUser.uid // Guarda el UID del usuario anónimo
            }).then(() => {
                intentionText.value = '';
                console.log('Intención enviada');
            }).catch(error => {
                console.error("Error al enviar la intención:", error);
            });
        }
    });

    // Maneja el borrado de intenciones
    intentionsList.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de que quieres borrar tu intención?')) {
                intentionsRef.child(key).remove()
                    .then(() => console.log('Intención borrada'))
                    .catch(error => console.error('Error al borrar:', error));
            }
        }
    });
});

// Función para el menú de navegación en dispositivos móviles
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('active');
}
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

document.addEventListener('DOMContentLoaded', () => {
    const adminIntentionsList = document.getElementById('admin-intentions-list');
    const logoutBtn = document.getElementById('logout-btn');
    const editModal = document.getElementById('edit-modal');
    const editTextarea = document.getElementById('edit-text');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const closeBtn = document.querySelector('.close-btn');
    let currentKey = null;

    // Función para cargar las intenciones desde la base de datos
    function loadIntentions() {
        intentionsRef.on('value', (snapshot) => {
            adminIntentionsList.innerHTML = '';
            const intentions = snapshot.val();
            if (intentions) {
                Object.keys(intentions).reverse().forEach(key => {
                    const intention = intentions[key];
                    const row = document.createElement('tr');
                    const formattedDate = new Date(intention.timestamp).toLocaleDateString();

                    row.innerHTML = `
                        <td data-label="Intención">${intention.text}</td>
                        <td data-label="Fecha">${formattedDate}</td>
                        <td data-label="Acciones">
                            <button class="edit-btn" data-key="${key}">Editar</button>
                            <button class="delete-btn" data-key="${key}">Borrar</button>
                        </td>
                    `;
                    adminIntentionsList.appendChild(row);
                });
            }
        });
    }

    // Verifica el estado de autenticación del usuario
    auth.onAuthStateChanged(user => {
        const adminPanel = document.querySelector('.admin-panel');
        if (user) {
            // El usuario está logueado, muestra el panel y carga los datos.
            adminPanel.style.display = 'block';
            loadIntentions(); // Llama a la función para cargar las intenciones
        } else {
            // El usuario no está logueado, redirige a la página de login.
            window.location.href = 'login.html';
        }
    });

    // Maneja los clics de los botones de la tabla
    adminIntentionsList.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
        if (!key) return;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de que quieres borrar esta intención?')) {
                intentionsRef.child(key).remove()
                    .then(() => console.log('Intención borrada'))
                    .catch(error => console.error('Error al borrar:', error));
            }
        }
        if (e.target.classList.contains('edit-btn')) {
            currentKey = key;
            intentionsRef.child(key).once('value').then(snapshot => {
                editTextarea.value = snapshot.val().text;
                editModal.style.display = 'flex';
            });
        }
    });

    // Lógica del modal de edición
    closeBtn.onclick = () => {
        editModal.style.display = 'none';
    };

    window.onclick = (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    };

    saveEditBtn.onclick = () => {
        const newText = editTextarea.value.trim();
        if (newText && currentKey) {
            intentionsRef.child(currentKey).update({ text: newText })
                .then(() => {
                    editModal.style.display = 'none';
                    console.log('Intención actualizada');
                })
                .catch(error => console.error('Error al actualizar:', error));
        }
    };

    // Lógica para cerrar sesión
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch(error => {
            console.error('Error al cerrar sesión:', error);
        });
    });
});

// Función para el menú de navegación en dispositivos móviles
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('active');
}
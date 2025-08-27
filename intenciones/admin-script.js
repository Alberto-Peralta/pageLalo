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

// UIDs de los administradores. Deben coincidir con los de `script.js`.
const adminUIDs = ["xqhClOg845dSU5XIu4vqTCy4XAj2", "UbR2AIirbiNH7uCXfl5P7rSWpIB2"];

document.addEventListener('DOMContentLoaded', () => {
    const adminIntentionsList = document.getElementById('admin-intentions-list');
    const logoutBtn = document.getElementById('logout-btn');
    const editModal = document.getElementById('edit-modal');
    const editTextarea = document.getElementById('edit-text');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const closeBtn = document.querySelector('.close-btn');
    const menuLinks = document.querySelectorAll('.menu a');
    let currentKey = null;

    // Redirige al login si no hay un usuario autenticado o si no es un admin
    auth.onAuthStateChanged(user => {
        const adminPanel = document.querySelector('.admin-panel');
        if (user && adminUIDs.includes(user.uid)) {
            adminPanel.style.display = 'block';
        } else {
            window.location.href = 'login.html';
        }
    });

    // Muestra las intenciones en la tabla
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

    // Cierra el menú cuando se hace clic en un enlace del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            toggleMenu();
        });
    });
});

// Función para el menú de navegación en dispositivos móviles
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.toggle('active');
    }
}
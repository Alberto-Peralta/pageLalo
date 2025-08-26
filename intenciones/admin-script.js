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

    // Redirige al login si no hay un usuario autenticado
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            // Muestra el panel de administración si el usuario está autenticado
            document.querySelector('.admin-panel').style.display = 'block';
        }
    });

    // Muestra las intenciones en la tabla de administración
    intentionsRef.on('value', (snapshot) => {
        const intentions = snapshot.val();
        adminIntentionsList.innerHTML = '';
        if (intentions) {
            Object.keys(intentions).reverse().forEach(key => {
                const intention = intentions[key];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${intention.text}</td>
                    <td>${new Date(intention.timestamp).toLocaleDateString()}</td>
                    <td>
                        <button class="edit-btn" data-key="${key}">Editar</button>
                        <button class="delete-btn" data-key="${key}">Borrar</button>
                    </td>
                `;
                adminIntentionsList.appendChild(row);
            });
        }
    });

    // Maneja los clics en la tabla para editar o borrar
    adminIntentionsList.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
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
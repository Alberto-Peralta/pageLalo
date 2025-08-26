// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
    authDomain: "pagelalo-1b210.firebaseapp.com",
    projectId: "pagelalo-1b210",
    storageBucket: "pagelalo-1b210.firebasestorage.app",
    messagingSenderId: "1096735980204",
    appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
};

// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const intentionsRef = database.ref('intenciones');

let currentUser; // Variable global para almacenar el usuario actual

// ID de administrador para el panel de control. CÁMBIALO a un valor único y seguro.
// Puedes crear este ID en tu consola de Firebase o usar cualquier string único.
const ADMIN_ID = 'lalo_admin_12345'; 

document.addEventListener('DOMContentLoaded', () => {
    const intentionForm = document.getElementById('intention-form');
    const intentionText = document.getElementById('intention-text');
    const intentionsList = document.getElementById('intentions-list');
    const adminPanel = document.getElementById('admin-panel');

    // ** Autenticación Anónima de Firebase **
    // Esto crea o carga un usuario anónimo para cada sesión.
    auth.signInAnonymously()
        .then(() => {
            currentUser = auth.currentUser;
            console.log("Usuario autenticado anónimamente:", currentUser.uid);

            // Si el usuario es el administrador, muestra el panel de control
            if (currentUser.uid === ADMIN_ID) {
                if (adminPanel) {
                    adminPanel.style.display = 'block';
                }
            }
        })
        .catch((error) => {
            console.error("Error al autenticar:", error);
            // Mostrar un mensaje de error al usuario
            if (intentionsList) {
                intentionsList.innerHTML = `<p style="color:red;">Error de autenticación: ${error.message}</p>`;
            }
        });

    // ** Lógica para leer las intenciones en tiempo real **
    if (intentionsRef) {
        intentionsRef.on('value', (snapshot) => {
            const intentions = snapshot.val();
            if (intentionsList) {
                intentionsList.innerHTML = '';
            }

            if (intentions) {
                const intentionKeys = Object.keys(intentions).reverse();
                intentionKeys.forEach(key => {
                    const intention = intentions[key];
                    const item = document.createElement('div');
                    item.className = 'intention-item';

                    // Usamos innerHTML para incluir los botones y el texto
                    let buttonsHtml = '';
                    // Solo muestra los botones de editar y borrar si el usuario es el autor O el administrador
                    if (currentUser && (currentUser.uid === intention.userId || currentUser.uid === ADMIN_ID)) {
                        buttonsHtml = `
                            <div class="intention-actions">
                                <button class="edit-btn" data-key="${key}">Editar</button>
                                <button class="delete-btn" data-key="${key}">Borrar</button>
                            </div>
                        `;
                    }
                    
                    item.innerHTML = `
                        <p>"${intention.text}"</p>
                        ${buttonsHtml}
                    `;
                    if (intentionsList) {
                        intentionsList.appendChild(item);
                    }
                });

                // Agrega los listeners a los botones después de que se han creado
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const key = e.target.dataset.key;
                        if (confirm('¿Estás seguro de que quieres borrar esta intención?')) {
                            intentionsRef.child(key).remove()
                                .catch(error => console.error("Error al borrar:", error));
                        }
                    });
                });

                document.querySelectorAll('.edit-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const key = e.target.dataset.key;
                        const intention = intentions[key];
                        if (intentionText) {
                           intentionText.value = intention.text;
                        }
                        if (intentionForm) {
                            intentionForm.dataset.editingKey = key; // Guarda la clave para saber qué intención editar
                        }
                    });
                });

            } else {
                if (intentionsList) {
                    intentionsList.innerHTML = '<p>Todavía no hay intenciones. ¡Sé el primero en enviar una!</p>';
                }
            }
        });
    }

    // ** Lógica para enviar una nueva intención o actualizar una existente **
    if (intentionForm) {
        intentionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = intentionText.value.trim();
            if (!text || !currentUser) return; // No hace nada si no hay texto o usuario

            const editingKey = intentionForm.dataset.editingKey;

            if (editingKey) {
                // Lógica para actualizar la intención existente
                intentionsRef.child(editingKey).update({
                    text: text
                }).then(() => {
                    if (intentionText) {
                        intentionText.value = ''; // Limpia el área de texto
                    }
                    delete intentionForm.dataset.editingKey; // Elimina la clave de edición
                }).catch(error => {
                    console.error("Error al actualizar:", error);
                });
            } else {
                // Lógica para guardar una nueva intención
                intentionsRef.push({
                    text: text,
                    userId: currentUser.uid, // Guarda el ID del usuario
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    if (intentionText) {
                        intentionText.value = '';
                    }
                }).catch((error) => {
                    console.error("Error al guardar:", error);
                });
            }
        });
    }
    
    // ** Lógica del panel de administración **
    const deleteAllBtn = document.getElementById('delete-all-btn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (confirm('Advertencia: Esto borrará TODAS las intenciones. ¿Estás seguro?')) {
                intentionsRef.remove()
                    .then(() => console.log("Todas las intenciones borradas"))
                    .catch(error => console.error("Error al borrar todas las intenciones:", error));
            }
        });
    }

});

// Función para mostrar u ocultar el menú en dispositivos móviles
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

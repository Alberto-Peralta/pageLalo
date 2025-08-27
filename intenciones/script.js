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
const rolesRef = database.ref('roles');

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

    // Autenticación anónima para usuarios no logueados
    auth.signInAnonymously().catch((error) => {
        console.error("Error al autenticar anónimamente:", error);
    });

    // Envía la intención de oración
    intentionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            console.error("No hay un usuario autenticado para enviar la intención.");
            return;
        }

        const newIntention = {
            text: intentionText.value,
            timestamp: Date.now(),
            userId: user.uid, // Guardamos el UID del usuario que crea la intención
            joinedBy: [user.uid] // El autor se une automáticamente a su intención
        };

        intentionsRef.push(newIntention)
            .then(() => {
                intentionText.value = ''; // Limpia el formulario
            })
            .catch(error => {
                console.error("Error al guardar en la base de datos:", error);
            });
    });

    // Muestra las intenciones en tiempo real
    intentionsRef.on('value', (snapshot) => {
        intentionsList.innerHTML = '';
        const intentions = snapshot.val();
        const user = auth.currentUser;
        if (intentions) {
            const intentionKeys = Object.keys(intentions).reverse();
            intentionKeys.forEach(key => {
                const intention = intentions[key];
                const date = new Date(intention.timestamp);
                const formattedDate = date.toLocaleDateString();

                const isAuthor = user && intention.userId === user.uid;
                const isAdminPromise = user ? rolesRef.child(user.uid).once('value').then(s => s.val() === true) : Promise.resolve(false);

                isAdminPromise.then(isAdmin => {
                    const joinedCount = intention.joinedBy ? intention.joinedBy.length : 0;
                    const userJoined = user && intention.joinedBy && intention.joinedBy.includes(user.uid);
                    const buttonText = userJoined ? 'Te uniste a esta intención' : 'Unirme a esta intención';
                    const buttonDisabled = ''; // El botón nunca está deshabilitado para que se pueda desunir

                    const countLegend = isAuthor ? `${joinedCount} personas se han unido a tu intención` : `${joinedCount} personas unidas`;

                    const item = document.createElement('div');
                    item.classList.add('intention-item');

                    item.innerHTML = `
                        <p>${intention.text}</p>
                        <div class="intention-meta">
                            <span>${formattedDate}</span>
                            <button class="join-btn" data-key="${key}" ${buttonDisabled}>${buttonText}</button>
                            <span class="join-count">${countLegend}</span>
                            ${isAuthor || isAdmin ? `<button class="edit-btn" data-key="${key}">Editar</button>` : ''}
                            ${isAuthor || isAdmin ? `<button class="delete-btn" data-key="${key}">Borrar</button>` : ''}
                        </div>
                    `;
                    intentionsList.appendChild(item);
                });
            });
        }
    });

    // Lógica para borrar, editar y unirse
    intentionsList.addEventListener('click', (e) => {
        // --- INICIO DE LA MODIFICACIÓN ---
        e.preventDefault(); // Evita que el navegador realice la acción por defecto del botón.
        // --- FIN DE LA MODIFICACIÓN ---

        const key = e.target.getAttribute('data-key');
        if (!key) return;

        // Lógica del botón de unirse/desunirse
        if (e.target.classList.contains('join-btn')) {
            const user = auth.currentUser;
            if (!user) {
                console.error("No hay un usuario autenticado.");
                return;
            }

            const intentionRef = intentionsRef.child(key);
            intentionRef.transaction(currentIntention => {
                if (currentIntention) {
                    if (!currentIntention.joinedBy) {
                        currentIntention.joinedBy = [];
                    }
                    const userIndex = currentIntention.joinedBy.indexOf(user.uid);
                    if (userIndex === -1) {
                        // Unirse
                        currentIntention.joinedBy.push(user.uid);
                    } else {
                        // Desunirse
                        currentIntention.joinedBy.splice(userIndex, 1);
                    }
                }
                return currentIntention;
            }, (error, committed) => {
                if (error) {
                    console.error("Error al unirse/desunirse de la intención:", error);
                } else if (committed) {
                    console.log("Acción completada.");
                }
            });
            return;
        }

        // Lógica para el botón de borrar
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de que quieres borrar tu intención?')) {
                intentionsRef.child(key).remove()
                    .then(() => console.log('Intención borrada'))
                    .catch(error => console.error('Error al borrar:', error));
            }
        }

        // Lógica para el botón de editar
        if (e.target.classList.contains('edit-btn')) {
            currentKey = key;
            const intentionToEdit = intentionsRef.child(key);
            intentionToEdit.once('value').then(snapshot => {
                const intentionData = snapshot.val();
                if (intentionData) {
                    editTextarea.value = intentionData.text;
                    editModal.style.display = 'flex';
                }
            });
        }
    });

    // Lógica para el modal de edición
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
});

// Función para el menú de navegación en dispositivos móviles
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('active');
}
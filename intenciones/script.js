// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
    authDomain: "pagelalo-1b210.firebaseapp.com",
    projectId: "pagelalo-1b210",
    storageBucket: "pagelalo-1b210.firebasestorage.app",
    messagingSenderId: "1096735980204",
    appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
};

// Importa los módulos de Firebase que vamos a usar
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const intentionsRef = database.ref('intenciones');

document.addEventListener('DOMContentLoaded', () => {
    const intentionForm = document.getElementById('intention-form');
    const intentionText = document.getElementById('intention-text');
    const intentionsList = document.getElementById('intentions-list');

    // ** Autenticación Anónima **
    auth.signInAnonymously().catch((error) => {
        console.error("Error al autenticar anónimamente:", error);
    });
    
    // ** Leer intenciones y mostrar botones de acción **
    intentionsRef.on('value', (snapshot) => {
        const intentions = snapshot.val();
        intentionsList.innerHTML = '';
        const user = auth.currentUser;

        if (intentions) {
            const intentionKeys = Object.keys(intentions).reverse();
            intentionKeys.forEach(key => {
                const intention = intentions[key];
                const item = document.createElement('div');
                item.className = 'intention-item';
                
                let actionsHtml = '';
                if (user && user.uid === intention.userId) {
                    actionsHtml = `
                        <div class="actions">
                            <button class="edit-btn" data-key="${key}">Editar</button>
                            <button class="delete-btn" data-key="${key}">Borrar</button>
                        </div>
                    `;
                }

                item.innerHTML = `
                    <p>"${intention.text}"</p>
                    ${actionsHtml}
                `;
                intentionsList.appendChild(item);
            });
        } else {
            intentionsList.innerHTML = '<p>Todavía no hay intenciones. ¡Sé el primero en enviar una!</p>';
        }
    });

    // ** Lógica para enviar una nueva intención **
    intentionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = intentionText.value.trim();
        const user = auth.currentUser;

        if (text && user) {
            intentionsRef.push({
                text: text,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                userId: user.uid
            }).then(() => {
                intentionText.value = '';
            }).catch((error) => {
                console.error("Error al guardar la intención:", error);
                intentionsList.innerHTML = `<p style="color:red;">Error: ${error.message}. No se pudo enviar la intención.</p>`;
            });
        }
    });

    // ** Delegación de eventos para los botones de editar y borrar **
    intentionsList.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        if (!key) return;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de que quieres borrar tu intención?')) {
                intentionsRef.child(key).remove()
                    .then(() => console.log('Intención borrada por el autor'))
                    .catch(error => console.error('Error al borrar:', error));
            }
        }
    });
});
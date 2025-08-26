// Your web app's Firebase configuration
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
const intentionsRef = database.ref('intenciones'); // Referencia a la "tabla" de intenciones en la base de datos

document.addEventListener('DOMContentLoaded', () => {
    const intentionForm = document.getElementById('intention-form');
    const intentionText = document.getElementById('intention-text');
    const intentionsList = document.getElementById('intentions-list');

    // ** Lógica para leer las intenciones de la base de datos en tiempo real **
    // onValue escucha los cambios en la base de datos. Se activa al inicio y cada vez que hay una actualización.
    intentionsRef.on('value', (snapshot) => {
        const intentions = snapshot.val(); // Obtiene todos los datos de 'intenciones'
        intentionsList.innerHTML = ''; // Limpia la lista actual

        if (intentions) {
            // Convierte el objeto de intenciones en un array para poder recorrerlo
            const intentionKeys = Object.keys(intentions).reverse(); // Muestra las más recientes primero
            intentionKeys.forEach(key => {
                const intention = intentions[key];
                const item = document.createElement('div');
                item.className = 'intention-item';
                // Usamos innerHTML para incluir el párrafo con el texto de la intención
                item.innerHTML = `<p>"${intention.text}"</p>`;
                intentionsList.appendChild(item);
            });
        } else {
            intentionsList.innerHTML = '<p>Todavía no hay intenciones. ¡Sé el primero en enviar una!</p>';
        }
    });

    // ** Lógica para enviar una nueva intención a la base de datos **
    intentionForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue
        const text = intentionText.value.trim();

        if (text) {
            // Guarda la nueva intención en la base de datos usando .push()
            // Firebase le asignará una clave única
            intentionsRef.push({
                text: text,
                timestamp: firebase.database.ServerValue.TIMESTAMP // Guarda la fecha y hora del servidor
            }).then(() => {
                intentionText.value = ''; // Limpia el área de texto
            }).catch((error) => {
                console.error("Error al guardar la intención:", error);
                // Usamos un modal o un mensaje en la página en lugar de alert()
                intentionsList.innerHTML = `<p style="color:red;">Error: ${error.message}. No se pudo enviar la intención.</p>`;
            });
        }
    });

    // Esta función ya no es necesaria con onValue()
    // Ya que la lista se actualiza automáticamente
    // async function fetchIntentions() { ... }
});
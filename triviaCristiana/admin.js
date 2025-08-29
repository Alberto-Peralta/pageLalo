// Importaciones de Firebase (modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Variables del juego
let db;
let auth;

// Esta función es para manejar mensajes que normalmente se mostrarían con alert()
function showMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        padding: 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        text-align: center;
    `;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);
    setTimeout(() => {
        document.body.removeChild(messageBox);
    }, 3000);
}

// Función para manejar el cuadro de diálogo de confirmación personalizado
function showConfirm(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        width: 300px;
    `;

    const messageText = document.createElement('p');
    messageText.textContent = message;
    dialog.appendChild(messageText);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.onclick = () => {
        onConfirm();
        document.body.removeChild(overlay);
    };
    confirmBtn.style.cssText = `
        margin-right: 10px;
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 4px;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => {
        if (onCancel) onCancel();
        document.body.removeChild(overlay);
    };
    cancelBtn.style.cssText = `
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 4px;
    `;

    dialog.appendChild(confirmBtn);
    dialog.appendChild(cancelBtn);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

// Inicializa Firebase y obtiene las instancias de Realtime Database y Auth
async function initializeFirebase() {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
            authDomain: "pagelalo-1b210.firebaseapp.com",
            databaseURL: "https://pagelalo-1b210-default-rtdb.firebaseio.com",
            projectId: "pagelalo-1b210",
            storageBucket: "pagelalo-1b210.firebasestorage.app",
            messagingSenderId: "1096735980204",
            appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
        };
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getDatabase(app);

        // AVISO IMPORTANTE: ESTO ES SÓLO PARA PRUEBAS LOCALES.
        // Deshabilita la autenticación para mostrar el panel de administración directamente.
        // NO USES ESTO EN PRODUCCIÓN, ya que tu panel quedaría expuesto a cualquier persona.
        
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        listenForQuestions();


    } catch (error) {
        console.error("Error al inicializar Firebase:", error);
        showMessage("Error al conectar con la base de datos.");
    }
}

// Elementos de la UI
const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const questionsTableBody = document.querySelector('#questions-table tbody');
const saveQuestionBtn = document.getElementById('save-question-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const questionIdInput = document.getElementById('question-id');

// Nuevos elementos para el login
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

// Manejar el clic del botón de login
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (email && password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // La función onAuthStateChanged se encargará de mostrar el panel si el rol es correcto
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            showMessage("Error al iniciar sesión. Verifica tu correo y contraseña.");
        }
    } else {
        showMessage("Por favor, ingresa tu correo y contraseña.");
    }
});

// Manejar el clic del botón de cerrar sesión
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showMessage("Sesión cerrada correctamente.");
        // Opcional: Recargar la página para volver al estado inicial de login
        window.location.reload(); 
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        showMessage("Error al cerrar sesión.");
    }
});

// Obtener todas las preguntas de Realtime Database y mostrarlas en la tabla
function listenForQuestions() {
    onValue(ref(db, 'questions'), (snapshot) => {
        questionsTableBody.innerHTML = ''; // Limpia el cuerpo de la tabla
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const id = childSnapshot.key;
                const question = childSnapshot.val();
                const row = questionsTableBody.insertRow();
                row.dataset.id = id;

                row.insertCell(0).textContent = question.pregunta;
                row.insertCell(1).textContent = question.dificultad;

                const actionsCell = row.insertCell(2);
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Editar';
                editBtn.onclick = () => editQuestion(id);
                actionsCell.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Borrar';
                deleteBtn.onclick = () => deleteQuestion(id);
                actionsCell.appendChild(deleteBtn);
            });
        }
    });
}

// Añadir un listener al botón de guardar
saveQuestionBtn.addEventListener('click', async () => {
    const questionId = questionIdInput.value;
    const pregunta = document.getElementById('question-text-input').value;
    const opciones = [
        document.getElementById('option-a').value,
        document.getElementById('option-b').value,
        document.getElementById('option-c').value,
        document.getElementById('option-d').value,
    ];
    const respuesta = document.getElementById('correct-answer').value;
    const dificultad = document.getElementById('difficulty').value;

    if (pregunta && opciones.every(opt => opt) && respuesta && dificultad) {
        const newQuestion = {
            pregunta,
            opciones,
            respuesta,
            dificultad,
        };

        try {
            if (questionId) {
                // Actualizar una pregunta existente
                await set(ref(db, 'questions/' + questionId), newQuestion);
                showMessage("Pregunta actualizada con éxito.");
            } else {
                // Añadir una nueva pregunta
                const newPostRef = push(ref(db, 'questions'));
                await set(newPostRef, newQuestion);
                showMessage("Pregunta guardada con éxito.");
            }
            clearForm();
        } catch (error) {
            console.error("Error al guardar la pregunta:", error);
            showMessage("Error al guardar la pregunta.");
        }
    } else {
        showMessage("Por favor, rellene todos los campos.");
    }
});

// Cargar una pregunta en el formulario para editar
async function editQuestion(questionId) {
    try {
        const snapshot = await get(ref(db, 'questions/' + questionId));
        if (snapshot.exists()) {
            const question = snapshot.val();
            questionIdInput.value = snapshot.key;
            document.getElementById('question-text-input').value = question.pregunta;
            document.getElementById('option-a').value = question.opciones[0];
            document.getElementById('option-b').value = question.opciones[1];
            document.getElementById('option-c').value = question.opciones[2];
            document.getElementById('option-d').value = question.opciones[3];
            document.getElementById('correct-answer').value = question.respuesta;
            document.getElementById('difficulty').value = question.dificultad;
            saveQuestionBtn.textContent = "Actualizar Pregunta";
            cancelEditBtn.style.display = 'inline-block';
        } else {
            showMessage("No se encontró la pregunta.");
        }
    } catch (error) {
        console.error("Error al cargar la pregunta para edición:", error);
    }
}

// Borrar una pregunta
function deleteQuestion(questionId) {
    showConfirm("¿Estás seguro de que quieres borrar esta pregunta?", async () => {
        try {
            await remove(ref(db, 'questions/' + questionId));
            showMessage("Pregunta borrada con éxito.");
        } catch (error) {
            console.error("Error al borrar la pregunta:", error);
            showMessage("Error al borrar la pregunta.");
        }
    });
}

// Limpiar el formulario
function clearForm() {
    questionIdInput.value = '';
    document.getElementById('question-text-input').value = '';
    document.getElementById('option-a').value = '';
    document.getElementById('option-b').value = '';
    document.getElementById('option-c').value = '';
    document.getElementById('option-d').value = '';
    saveQuestionBtn.textContent = "Guardar Pregunta";
    cancelEditBtn.style.display = 'none';
}

// Añadir un listener al botón de cancelar
cancelEditBtn.addEventListener('click', clearForm);

// Inicia la aplicación
initializeFirebase();
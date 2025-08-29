// Importaciones de Firebase (modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Variables del juego
let db;
let auth;

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


// Esta función es para manejar mensajes que normalmente se mostrarían con alert()
function showMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: fadein 0.5s, fadeout 0.5s 2.5s;
    `;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);
    setTimeout(() => {
        document.body.removeChild(messageBox);
    }, 3000);
}

// Iniciar sesión
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage("Inicio de sesión exitoso.");
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        showMessage("Error al iniciar sesión: " + error.message);
    }
});

// Cerrar sesión
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showMessage("Sesión cerrada correctamente.");
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        showMessage("Error al cerrar sesión: " + error.message);
    }
});

// Listener del estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        loadQuestions();
    } else {
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

// Cargar preguntas existentes
function loadQuestions() {
    const questionsRef = ref(db, 'questions');
    onValue(questionsRef, (snapshot) => {
        questionsTableBody.innerHTML = '';
        const questions = snapshot.val();
        if (questions) {
            Object.keys(questions).forEach(id => {
                const question = questions[id];
                const row = questionsTableBody.insertRow();
                row.innerHTML = `
                    <td>${question.pregunta}</td>
                    <td>${question.dificultad}</td>
                    <td>
                        <button class="edit-btn" data-id="${id}">Editar</button>
                        <button class="delete-btn" data-id="${id}">Borrar</button>
                    </td>
                `;
            });
            document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
            document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
        }
    });
}

// Guardar o actualizar una pregunta
saveQuestionBtn.addEventListener('click', async () => {
    const id = questionIdInput.value;
    const newQuestion = {
        pregunta: document.getElementById('question-text-input').value,
        opciones: [
            document.getElementById('option-a').value,
            document.getElementById('option-b').value,
            document.getElementById('option-c').value,
            document.getElementById('option-d').value
        ],
        respuesta: document.getElementById('correct-answer').value,
        dificultad: document.getElementById('difficulty').value
    };

    if (id) {
        // Actualizar pregunta
        try {
            await set(ref(db, 'questions/' + id), newQuestion);
            showMessage("Pregunta actualizada con éxito.");
        } catch (error) {
            console.error("Error al actualizar la pregunta:", error);
            showMessage("Error al actualizar la pregunta.");
        }
    } else {
        // Añadir nueva pregunta
        try {
            await push(ref(db, 'questions'), newQuestion);
            showMessage("Pregunta añadida con éxito.");
        } catch (error) {
            console.error("Error al añadir la pregunta:", error);
            showMessage("Error al añadir la pregunta.");
        }
    }
    clearForm();
});

// Lógica de edición
async function handleEdit(e) {
    const questionId = e.target.dataset.id;
    const questionRef = ref(db, 'questions/' + questionId);
    try {
        const snapshot = await get(questionRef);
        const question = snapshot.val();
        if (question) {
            questionIdInput.value = questionId;
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
function handleDelete(e) {
    const questionId = e.target.dataset.id;
    if (confirm("¿Estás seguro de que quieres borrar esta pregunta?")) {
        try {
            remove(ref(db, 'questions/' + questionId));
            showMessage("Pregunta borrada con éxito.");
        } catch (error) {
            console.error("Error al borrar la pregunta:", error);
            showMessage("Error al borrar la pregunta.");
        }
    }
}

// Limpiar el formulario
function clearForm() {
    questionIdInput.value = '';
    document.getElementById('question-text-input').value = '';
    document.getElementById('option-a').value = '';
    document.getElementById('option-b').value = '';
    document.getElementById('option-c').value = '';
    document.getElementById('option-d').value = '';
    document.getElementById('correct-answer').value = 'A';
    document.getElementById('difficulty').value = 'facil';
    saveQuestionBtn.textContent = "Guardar Pregunta";
    cancelEditBtn.style.display = 'none';
}

// Añadir un listener al botón de cancelar
cancelEditBtn.addEventListener('click', () => {
    clearForm();
});

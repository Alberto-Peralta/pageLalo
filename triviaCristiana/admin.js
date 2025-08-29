// Importaciones de Firebase (modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, remove, get } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// === Copia y pega tu configuración de Firebase aquí ===
const firebaseConfig = {
    apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
    authDomain: "pagelalo-1b210.firebaseapp.com",
    databaseURL: "https://pagelalo-1b210-default-rtdb.firebaseio.com",
    projectId: "pagelalo-1b210",
    storageBucket: "pagelalo-1b210.firebasestorage.app",
    messagingSenderId: "1096735980204",
    appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
};
// =======================================================


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Variables del juego
// Elementos de la UI
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const questionIdInput = document.getElementById('question-id');
const questionTextInput = document.getElementById('question-text-input');
const optionAInput = document.getElementById('option-a');
const optionBInput = document.getElementById('option-b');
const optionCInput = document.getElementById('option-c');
const optionDInput = document.getElementById('option-d');
const difficultySelect = document.getElementById('difficulty');
const saveQuestionBtn = document.getElementById('save-question-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const questionsTableBody = document.querySelector('#questions-table tbody');

// Manejar autenticación
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

// Event listeners
loginBtn.addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .catch(error => {
            console.error("Error de inicio de sesión:", error);
            showMessage("Error de inicio de sesión: " + error.message);
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

saveQuestionBtn.addEventListener('click', saveQuestion);
cancelEditBtn.addEventListener('click', clearForm);

// === Lógica para la conexión a Firebase y carga de datos ===
function loadQuestions() {
    const questionsRef = ref(db, 'questions');
    onValue(questionsRef, (snapshot) => {
        const data = snapshot.val();
        renderQuestions(data);
    });
}

function renderQuestions(questions) {
    questionsTableBody.innerHTML = '';
    if (questions) {
        Object.entries(questions).forEach(([key, value]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${value.pregunta}</td>
                <td>${value.dificultad}</td>
                <td>
                    <button class="edit-btn" data-id="${key}">Editar</button>
                    <button class="delete-btn" data-id="${key}">Borrar</button>
                </td>
            `;
            questionsTableBody.appendChild(row);
        });
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
    }
}

// Guardar/Actualizar una pregunta
async function saveQuestion() {
    const questionId = questionIdInput.value;
    const newQuestion = questionTextInput.value;
    const optionA = optionAInput.value;
    const optionB = optionBInput.value;
    const optionC = optionCInput.value;
    const optionD = optionDInput.value;
    const difficulty = difficultySelect.value;
    
    // Obtener la respuesta correcta del radio input
    const correcta = document.querySelector('input[name="correcta"]:checked').value;

    if (!newQuestion || !optionA || !optionB || !optionC || !optionD) {
        showMessage("Por favor, llena todos los campos de la pregunta.");
        return;
    }

    const questionData = {
        pregunta: newQuestion,
        opciones: [optionA, optionB, optionC, optionD],
        respuesta: correcta, // <-- CAMBIO AQUÍ
        dificultad: difficulty
    };

    try {
        if (questionId) {
            // Actualizar pregunta existente
            await set(ref(db, 'questions/' + questionId), questionData);
            showMessage("Pregunta actualizada con éxito.");
        } else {
            // Agregar nueva pregunta
            await push(ref(db, 'questions'), questionData);
            showMessage("Pregunta guardada con éxito.");
        }
        clearForm();
    } catch (error) {
        console.error("Error al guardar la pregunta:", error);
        showMessage("Error al guardar la pregunta.");
    }
}

// Editar una pregunta
async function handleEdit(e) {
    const questionId = e.target.dataset.id;
    const questionRef = ref(db, 'questions/' + questionId);
    try {
        const snapshot = await get(questionRef);
        const question = snapshot.val();
        if (question) {
            questionIdInput.value = questionId;
            questionTextInput.value = question.pregunta;
            optionAInput.value = question.opciones[0];
            optionBInput.value = question.opciones[1];
            optionCInput.value = question.opciones[2];
            optionDInput.value = question.opciones[3];
            
            // Marcar el radio button de la respuesta correcta
            document.querySelector(`input[name="correcta"][value="${question.respuesta}"]`).checked = true;
            
            difficultySelect.value = question.dificultad;
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
    questionTextInput.value = '';
    optionAInput.value = '';
    optionBInput.value = '';
    optionCInput.value = '';
    optionDInput.value = '';
    document.getElementById('correct-A').checked = true;
    difficultySelect.value = 'facil';
    saveQuestionBtn.textContent = "Guardar Pregunta";
    cancelEditBtn.style.display = 'none';
}

function showMessage(msg) {
    // Puedes usar una función de alerta o un div de mensaje en el HTML
    alert(msg);
}
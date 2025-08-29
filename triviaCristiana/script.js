// Importaciones de Firebase (modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://TU_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Variables del juego
let preguntas = [];
let preguntaActualIndex = 0;
let puntuacion = 0;
let comodin5050Usado = false;
let comodinPasarPreguntaUsado = false;
let temporizador;
const TIEMPO_POR_PREGUNTA = 30;
let tiempoRestante = TIEMPO_POR_PREGUNTA;
let juegoPausado = false;

// Referencias a los elementos del DOM
const scoreDisplay = document.getElementById('score-display');
const timeDisplay = document.getElementById('time');
const questionTextElement = document.getElementById('question-text');
const answerButtons = [
    document.getElementById('answer1'),
    document.getElementById('answer2'),
    document.getElementById('answer3'),
    document.getElementById('answer4')
];
const confirmBtn = document.getElementById('confirm-btn');
const fiftyFiftyBtn = document.getElementById('fifty-fifty');
const pauseTimeBtn = document.getElementById('pause-time');
const nextQuestionBtn = document.getElementById('next-question');
const endScreen = document.getElementById('end-screen');
const finalScoreElement = document.getElementById('final-score');
const questionsAnsweredElement = document.getElementById('questions-answered');
const timeRemainingElement = document.getElementById('time-remaining');
const restartBtn = document.getElementById('restart-btn');

// --- Lógica del juego ---

// Cargar preguntas desde Firebase
function cargarPreguntas() {
    const preguntasRef = ref(db, 'questions');
    onValue(preguntasRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            preguntas = Object.values(data);
            iniciarJuego();
        } else {
            // Si no hay preguntas en la base de datos, usamos las del archivo local
            // Suponiendo que tienes un archivo preguntas.js con el array 'preguntas'
            if (window.preguntas && window.preguntas.length > 0) {
                preguntas = window.preguntas;
                iniciarJuego();
            } else {
                mostrarAlerta("No se encontraron preguntas en la base de datos ni en el archivo local.");
            }
        }
    }, {
        onlyOnce: true
    });
}

function iniciarJuego() {
    preguntaActualIndex = 0;
    puntuacion = 0;
    comodin5050Usado = false;
    comodinPasarPreguntaUsado = false;
    juegoPausado = false;
    reiniciarComodines();
    actualizarPuntuacion();
    document.querySelector('.game-container').style.display = 'block';
    document.querySelector('#end-screen').style.display = 'none';
    mostrarPreguntaActual();
}

function mostrarPreguntaActual() {
    if (preguntaActualIndex >= preguntas.length) {
        mostrarPantallaFinal();
        return;
    }

    const pregunta = preguntas[preguntaActualIndex];
    questionTextElement.textContent = pregunta.pregunta;

    answerButtons.forEach((btn, index) => {
        btn.textContent = pregunta.opciones[index];
        btn.style.display = 'block';
        btn.classList.remove('selected', 'correct', 'incorrect');
        btn.disabled = false;
    });

    confirmBtn.disabled = true;
    iniciarTemporizador();
}

function iniciarTemporizador() {
    clearInterval(temporizador);
    tiempoRestante = TIEMPO_POR_PREGUNTA;
    timeDisplay.textContent = tiempoRestante;

    temporizador = setInterval(() => {
        if (!juegoPausado) {
            tiempoRestante--;
            timeDisplay.textContent = tiempoRestante;

            if (tiempoRestante <= 0) {
                clearInterval(temporizador);
                revisarRespuesta(null); // Pasa null para indicar que el tiempo se acabó
            }
        }
    }, 1000);
}

function pausarJuego() {
    juegoPausado = !juegoPausado;
    pauseTimeBtn.textContent = juegoPausado ? 'Continuar' : 'Pausar Tiempo';
}

function seleccionarRespuesta(event) {
    answerButtons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    confirmBtn.disabled = false;
}

function revisarRespuesta(respuestaSeleccionada) {
    clearInterval(temporizador);
    
    let esCorrecto = false;
    if (respuestaSeleccionada) {
        const respuestaCorrecta = preguntas[preguntaActualIndex].respuesta;
        if (respuestaSeleccionada.id.slice(-1) === respuestaCorrecta) {
            esCorrecto = true;
            respuestaSeleccionada.classList.add('correct');
            puntuacion++;
        } else {
            respuestaSeleccionada.classList.add('incorrect');
            // Marcar la respuesta correcta
            const respuestaCorrectaBtn = document.getElementById(`answer${respuestaCorrecta}`);
            if (respuestaCorrectaBtn) {
                respuestaCorrectaBtn.classList.add('correct');
            }
        }
    }

    answerButtons.forEach(btn => btn.disabled = true);
    actualizarPuntuacion();

    setTimeout(() => {
        preguntaActualIndex++;
        mostrarPreguntaActual();
    }, 2000);
}

function usar5050() {
    if (comodin5050Usado) {
        mostrarAlerta("Ya usaste este comodín.");
        return;
    }

    comodin5050Usado = true;
    fiftyFiftyBtn.disabled = true;

    const pregunta = preguntas[preguntaActualIndex];
    const respuestaCorrecta = pregunta.respuesta;
    const opcionesIncorrectas = pregunta.opciones.filter(op => op.substring(0, 1) !== respuestaCorrecta);
    const opcionesAEliminar = opcionesIncorrectas.slice(0, 2);

    opcionesAEliminar.forEach(op => {
        const btn = answerButtons.find(btn => btn.textContent === op);
        if (btn) {
            btn.style.display = 'none';
        }
    });
}

function pasarPregunta() {
    if (comodinPasarPreguntaUsado) {
        mostrarAlerta("Ya usaste este comodín.");
        return;
    }

    comodinPasarPreguntaUsado = true;
    nextQuestionBtn.disabled = true;

    preguntaActualIndex++;
    mostrarPreguntaActual();
}

function actualizarPuntuacion() {
    scoreDisplay.textContent = `Puntuación: ${puntuacion}`;
}

function mostrarPantallaFinal() {
    document.querySelector('.game-container').style.display = 'none';
    endScreen.style.display = 'block';
    finalScoreElement.textContent = `Puntuación final: ${puntuacion}`;
    questionsAnsweredElement.textContent = `Preguntas respondidas: ${preguntaActualIndex}`;
    timeRemainingElement.textContent = `Tiempo restante: ${tiempoRestante < 0 ? 0 : tiempoRestante} segundos`;
}

function reiniciarComodines() {
    fiftyFiftyBtn.disabled = false;
    nextQuestionBtn.disabled = false;
    comodin5050Usado = false;
    comodinPasarPreguntaUsado = false;
    pauseTimeBtn.textContent = 'Pausar Tiempo';
}

function mostrarAlerta(mensaje) {
    const modal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalOkBtn = document.getElementById('modal-ok-btn');

    modalMessage.textContent = mensaje;
    modal.style.display = 'block';
    
    modalOkBtn.onclick = () => {
        modal.style.display = 'none';
    };
}


// Listeners de eventos
answerButtons.forEach(btn => btn.addEventListener('click', seleccionarRespuesta));
confirmBtn.addEventListener('click', () => {
    const selectedBtn = document.querySelector('.answer-btn.selected');
    if (selectedBtn) {
        revisarRespuesta(selectedBtn);
    }
});
fiftyFiftyBtn.addEventListener('click', usar5050);
pauseTimeBtn.addEventListener('click', pausarJuego);
nextQuestionBtn.addEventListener('click', pasarPregunta);
restartBtn.addEventListener('click', iniciarJuego);

// Iniciar la carga de preguntas
cargarPreguntas();
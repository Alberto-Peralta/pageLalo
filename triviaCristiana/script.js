// Importaciones de Firebase (modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
    authDomain: "pagelalo-1b210.firebaseapp.com",
    databaseURL: "https://pagelalo-1b210-default-rtdb.firebaseio.com",
    projectId: "pagelalo-1b210",
    storageBucket: "pagelalo-1b210.firebasestorage.app",
    messagingSenderId: "1096735980204",
    appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
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
let comodinPausarTiempoUsado = false;
let temporizador;
const TIEMPO_POR_PREGUNTA = 30;
let tiempoRestante = TIEMPO_POR_PREGUNTA;
let juegoPausado = false;
let respuestaSeleccionada;
let estadoBotonConfirmar = 'confirmar'; // 'confirmar' o 'siguiente'

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
    comodinPausarTiempoUsado = false;
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
    confirmBtn.textContent = "Confirmar";
    estadoBotonConfirmar = 'confirmar';
    respuestaSeleccionada = null;
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
                revisarRespuesta(null);
            }
        }
    }, 1000);
}

function pausarJuego() {
    if (comodinPausarTiempoUsado) {
        mostrarAlerta("Ya usaste este comodín.");
        return;
    }
    
    juegoPausado = !juegoPausado;
    pauseTimeBtn.textContent = juegoPausado ? 'Continuar' : 'Pausar Tiempo';
    if (!juegoPausado) {
        comodinPausarTiempoUsado = true;
        pauseTimeBtn.disabled = true;
    }
}

function seleccionarRespuesta(event) {
    if (estadoBotonConfirmar === 'siguiente') {
        return; // No permitir selección después de confirmar
    }
    answerButtons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    respuestaSeleccionada = event.target;
    confirmBtn.disabled = false;
}

function revisarRespuesta() {
    clearInterval(temporizador);
    
    const pregunta = preguntas[preguntaActualIndex];
    const respuestaCorrectaLetra = pregunta.respuesta;
    const respuestaCorrectaIndex = ['A', 'B', 'C', 'D'].indexOf(respuestaCorrectaLetra);
    const respuestaCorrectaBtn = answerButtons[respuestaCorrectaIndex];

    if (respuestaSeleccionada) {
        const respuestaSeleccionadaIndex = answerButtons.indexOf(respuestaSeleccionada);
        if (respuestaSeleccionadaIndex === respuestaCorrectaIndex) {
            respuestaSeleccionada.classList.add('correct');
            puntuacion++;
        } else {
            respuestaSeleccionada.classList.add('incorrect');
            if (respuestaCorrectaBtn) {
                respuestaCorrectaBtn.classList.add('correct');
            }
        }
    } else {
        // En caso de que se acabe el tiempo
        if (respuestaCorrectaBtn) {
            respuestaCorrectaBtn.classList.add('correct');
        }
    }

    answerButtons.forEach(btn => btn.disabled = true);
    actualizarPuntuacion();
    confirmBtn.textContent = "Siguiente Pregunta";
    estadoBotonConfirmar = 'siguiente';
}

function pasarSiguientePregunta() {
    preguntaActualIndex++;
    mostrarPreguntaActual();
}

function usar5050() {
    if (comodin5050Usado) {
        mostrarAlerta("Ya usaste este comodín.");
        return;
    }

    comodin5050Usado = true;
    fiftyFiftyBtn.disabled = true;

    const pregunta = preguntas[preguntaActualIndex];
    const respuestaCorrectaLetra = pregunta.respuesta;
    const respuestaCorrectaIndex = ['A', 'B', 'C', 'D'].indexOf(respuestaCorrectaLetra);

    const opcionesIncorrectas = answerButtons.filter((btn, index) => index !== respuestaCorrectaIndex);
    
    const opcionesAEliminar = [];
    while (opcionesAEliminar.length < 2) {
        const randomIndex = Math.floor(Math.random() * opcionesIncorrectas.length);
        const opcion = opcionesIncorrectas[randomIndex];
        if (!opcionesAEliminar.includes(opcion)) {
            opcionesAEliminar.push(opcion);
        }
    }

    opcionesAEliminar.forEach(btn => {
        btn.style.display = 'none';
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
    pauseTimeBtn.disabled = false;
    comodin5050Usado = false;
    comodinPasarPreguntaUsado = false;
    comodinPausarTiempoUsado = false;
    pauseTimeBtn.textContent = 'Pausar Tiempo';
}

function mostrarAlerta(mensaje) {
    const modal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalOkBtn = document.getElementById('modal-ok-btn');

    modalMessage.textContent = mensaje;
    modal.style.display = 'flex';
    
    modalOkBtn.onclick = () => {
        modal.style.display = 'none';
    };
}


// Listeners de eventos
answerButtons.forEach(btn => btn.addEventListener('click', seleccionarRespuesta));

confirmBtn.addEventListener('click', () => {
    if (estadoBotonConfirmar === 'confirmar') {
        const selectedBtn = document.querySelector('.answer-btn.selected');
        if (selectedBtn) {
            revisarRespuesta();
        }
    } else {
        pasarSiguientePregunta();
    }
});

fiftyFiftyBtn.addEventListener('click', usar5050);
pauseTimeBtn.addEventListener('click', pausarJuego);
nextQuestionBtn.addEventListener('click', pasarPregunta);
restartBtn.addEventListener('click', iniciarJuego);

// Iniciar la carga de preguntas
cargarPreguntas();
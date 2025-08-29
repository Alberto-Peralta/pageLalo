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

// Toda la lógica del juego se ejecutará solo cuando la página esté completamente cargada.
document.addEventListener('DOMContentLoaded', () => {

    // Variables del juego
    let preguntas = [];
    let preguntaActualIndex = 0;
    let puntuacion = 0;
    let tiempoRestante = 30;
    let temporizador;
    let comodin5050Usado = false;
    let comodinPasarPreguntaUsado = false;
    let comodinPausarTiempoUsado = false;
    let estadoBotonConfirmar = 'confirmar';
    let esCorrecto = false;

    // Elementos de la UI
    const scoreDisplay = document.getElementById('score-display');
    const timeElement = document.getElementById('time');
    const questionTextElement = document.getElementById('question-text');
    const answerButtons = [
        document.getElementById('answer1'),
        document.getElementById('answer2'),
        document.getElementById('answer3'),
        document.getElementById('answer4')
    ];
    const confirmBtn = document.getElementById('confirm-btn');
    const endScreen = document.getElementById('end-screen');
    const finalScoreElement = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('restart-btn');
    const fiftyFiftyBtn = document.getElementById('fifty-fifty');
    const nextQuestionBtn = document.getElementById('next-question');
    const pauseTimeBtn = document.getElementById('pause-time');
    const messageModal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalOkBtn = document.getElementById('modal-ok-btn');
    const questionsAnsweredElement = document.getElementById('questions-answered');
    const timeRemainingElement = document.getElementById('time-remaining');


    // Función para barajar un array (algoritmo de Fisher-Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Cargar preguntas desde Firebase
    function loadQuestions() {
        const questionsRef = ref(db, 'questions');
        onValue(questionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                preguntas = Object.values(data);
                
                // Barajar las preguntas al cargarlas
                shuffleArray(preguntas);
                
                if (preguntas.length > 0) {
                    mostrarPregunta();
                } else {
                    questionTextElement.textContent = "No hay preguntas disponibles. Añade algunas en el panel de administración.";
                }
            } else {
                questionTextElement.textContent = "No hay preguntas disponibles. Añade algunas en el panel de administración.";
            }
        });
    }

    // Mostrar una pregunta
    function mostrarPregunta() {
        reiniciarTemporizador();
        if (preguntaActualIndex < preguntas.length) {
            const pregunta = preguntas[preguntaActualIndex];
            
            questionTextElement.textContent = pregunta.pregunta;

            answerButtons.forEach((btn, index) => {
                btn.textContent = pregunta.opciones[index];
                btn.classList.remove('selected', 'correct', 'incorrect');
                btn.disabled = false;
                btn.style.display = 'block';
            });

            confirmBtn.textContent = 'Confirmar';
            confirmBtn.disabled = true;
            estadoBotonConfirmar = 'confirmar';
            esCorrecto = false;
        } else {
            mostrarPantallaFinal();
        }
    }

    // Función para seleccionar una respuesta
    function seleccionarRespuesta(e) {
        answerButtons.forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        confirmBtn.disabled = false;
    }

    // Revisar la respuesta
    function revisarRespuesta() {
        clearInterval(temporizador);
        const selectedBtn = document.querySelector('.answer-btn.selected');
        const selectedAnswerIndex = Array.from(answerButtons).indexOf(selectedBtn);
        const correctAnswer = preguntas[preguntaActualIndex].respuesta;
        const correctIndex = correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0);

        answerButtons.forEach(btn => btn.disabled = true);

        if (selectedAnswerIndex === correctIndex) {
            puntuacion++;
            scoreDisplay.textContent = `Puntuación: ${puntuacion}`;
            selectedBtn.classList.add('correct');
            esCorrecto = true;
        } else {
            selectedBtn.classList.add('incorrect');
            answerButtons[correctIndex].classList.add('correct');
        }

        confirmBtn.textContent = 'Siguiente';
        confirmBtn.disabled = false;
        estadoBotonConfirmar = 'siguiente';
    }

    // Pasar a la siguiente pregunta
    function pasarSiguientePregunta() {
        preguntaActualIndex++;
        if (preguntaActualIndex < preguntas.length) {
            mostrarPregunta();
        } else {
            mostrarPantallaFinal();
        }
    }

    // Mostrar la pantalla final
    function mostrarPantallaFinal() {
        document.querySelector('.game-container').style.display = 'none';
        endScreen.style.display = 'flex';
        finalScoreElement.textContent = puntuacion;
        questionsAnsweredElement.textContent = preguntaActualIndex;
        timeRemainingElement.textContent = tiempoRestante;
    }

    // Reiniciar el juego
    function reiniciarJuego() {
        preguntaActualIndex = 0;
        puntuacion = 0;
        scoreDisplay.textContent = `Puntuación: ${puntuacion}`;
        endScreen.style.display = 'none';
        document.querySelector('.game-container').style.display = 'flex';
        reiniciarComodines();
        loadQuestions();
    }

    // Comodines
    fiftyFiftyBtn.addEventListener('click', () => {
        if (!comodin5050Usado) {
            comodin5050Usado = true;
            fiftyFiftyBtn.disabled = true;
            const pregunta = preguntas[preguntaActualIndex];
            const correctIndex = pregunta.respuesta.charCodeAt(0) - 'A'.charCodeAt(0);
            const opcionesIncorrectas = [0, 1, 2, 3].filter(i => i !== correctIndex);
            const aEliminar = opcionesIncorrectas.sort(() => 0.5 - Math.random()).slice(0, 2);

            aEliminar.forEach(index => {
                answerButtons[index].style.display = 'none';
            });

            mostrarAlerta("Se han eliminado dos opciones incorrectas.");
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        if (!comodinPasarPreguntaUsado) {
            comodinPasarPreguntaUsado = true;
            nextQuestionBtn.disabled = true;
            mostrarAlerta("Has usado tu comodín para pasar a la siguiente pregunta.");
            pasarSiguientePregunta();
        }
    });

    pauseTimeBtn.addEventListener('click', () => {
        if (!comodinPausarTiempoUsado) {
            comodinPausarTiempoUsado = true;
            pauseTimeBtn.disabled = true;
            clearInterval(temporizador);
            mostrarAlerta("Tiempo pausado.");
            pauseTimeBtn.textContent = 'Tiempo Pausado';
        } else {
            iniciarTemporizador();
            comodinPausarTiempoUsado = false;
            pauseTimeBtn.disabled = false;
            pauseTimeBtn.textContent = 'Pausar Tiempo';
        }
    });

    // Temporizador
    function iniciarTemporizador() {
        clearInterval(temporizador);
        tiempoRestante = 30;
        timeElement.textContent = tiempoRestante;
        temporizador = setInterval(() => {
            tiempoRestante--;
            timeElement.textContent = tiempoRestante;
            if (tiempoRestante <= 0) {
                clearInterval(temporizador);
                mostrarAlerta("¡Se acabó el tiempo!");
                if (document.querySelector('.answer-btn.selected')) {
                    revisarRespuesta();
                } else {
                    mostrarAlerta("¡Se acabó el tiempo! No seleccionaste ninguna respuesta.");
                    setTimeout(() => {
                        pasarSiguientePregunta();
                    }, 2000);
                }
            }
        }, 1000);
    }

    function reiniciarTemporizador() {
        clearInterval(temporizador);
        tiempoRestante = 30;
        timeElement.textContent = tiempoRestante;
        iniciarTemporizador();
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
        messageModal.style.display = 'flex';
        modalMessage.textContent = mensaje;
    }

    // Listeners de eventos
    answerButtons.forEach(btn => btn.addEventListener('click', seleccionarRespuesta));

    confirmBtn.addEventListener('click', () => {
        if (estadoBotonConfirmar === 'confirmar') {
            const selectedBtn = document.querySelector('.answer-btn.selected');
            if (selectedBtn) {
                revisarRespuesta();
            } else {
                mostrarAlerta("Por favor, selecciona una respuesta antes de confirmar.");
            }
        } else {
            pasarSiguientePregunta();
        }
    });

    modalOkBtn.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });

    playAgainBtn.addEventListener('click', reiniciarJuego);

    // Iniciar el juego
    loadQuestions();
});
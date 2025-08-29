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
    let estadoBotonConfirmar = 'confirmar';
    let esCorrecto = false;
    let comodin5050Usado = false;
    let comodinPasarPreguntaUsado = false;
    let comodinPausarTiempoUsado = false;
    let tiempoPausado = false;

    // Elementos de la UI
    const gameContainer = document.getElementById('game-container');
    const progressionScreen = document.getElementById('progression-screen');
    const progressionStepsContainer = document.getElementById('progression-steps-container');
    const continueBtn = document.getElementById('continue-btn');
    const questionTextElement = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const scoreDisplay = document.getElementById('score-display');
    const timeElement = document.getElementById('time');
    const confirmBtn = document.getElementById('confirm-btn');
    const fiftyFiftyBtn = document.getElementById('fifty-fifty');
    const nextQuestionBtn = document.getElementById('next-question');
    const pauseTimeBtn = document.getElementById('pause-time');
    const endScreen = document.getElementById('end-screen');
    const finalScoreSpan = document.getElementById('final-score');
    const questionsAnsweredSpan = document.getElementById('questions-answered');
    const remainingTimeSpan = document.getElementById('remaining-time');
    const restartBtn = document.getElementById('restart-btn');
    const messageModal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalOkBtn = document.getElementById('modal-ok-btn');

    // Datos de los 15 niveles de progresión
    const niveles = [
        { title: "Neófito", emoji: "🔰", description: "🍼 No sabe si se dice amén o salud, pero ya quiere evangelizar" },
        { title: "Catecúmeno", emoji: "📖", description: "⏳ Suena a hechizo de Harry Potter, pero en realidad es alguien que todavía no se bautiza... aunque ya se siente parte del team Jesús" },
        { title: "Aprendiz de la fe", emoji: "🔎", description: "🧐 Sabe que hay cuatro evangelios… pero cree que Pablo escribió uno" },
        { title: "Discípulo en formación", emoji: "💡", description: "📓 Sigue a Jesús… pero todavía se pierde entre Levítico y Deuteronomio" },
        { title: "Creyente comprometido", emoji: "🛐", description: "💪 Va a misa sin que lo arrastren. Hasta se emociona por el ofertorio" },
        { title: "Estudioso del Catecismo", emoji: "🧭", description: "📘 Le dicen el “Catekisman” porque cita el número exacto antes de que termines tu pregunta" },
        { title: "Iniciado en Teología", emoji: "🧠", description: "🧠 Dice cosas como ontología trinitaria mientras se sirve cereal y cree que Santo Tomás y San Agustín fueron roomies en el cielo" },
        { title: "Servidor pastoral", emoji: "✝️", description: "🛠️ Es el multiusos de la parroquia. Da catequesis, barre la capilla y hace teatro bíblico… todo en una tarde (Sueña con tener su propio gafete con foto y cita bíblicas)" },
        { title: "Estudiante de Teología", emoji: "📚", description: "Tiene más libros que calcetines. Sueña con San Agustín y tiene pesadillas con exámenes de eclesiología" },
        { title: "Teólogo en ejercicio", emoji: "🗝️", description: "🧠 La fe y la razón no se pelean… solo discuten apasionadamente (Corrige homilías mentalmente y empieza frases con: según la Patrística…)" },
        { title: "Licenciado en Teología", emoji: "🎓", description: "🎓 No presume, pero casualmente deja su título en la mesa cuando invitan café. Ya no dice “la Iglesia enseña”, dice “según el magisterio ordinario y extraordinario…" },
        { title: "Formador o Maestro de la fe", emoji: "🧱", description: "🗣️ Tiene anécdotas con todos los Papas desde Juan Pablo II… aunque nunca los conoció" },
        { title: "Profesor o Catedrático en Teología", emoji: "🧑‍🏫", description: "📚 Su escritorio tiene más latín que una misa tridentina. Puede corregir tu ensayo y tu vida espiritual en una sola mirada" },
        { title: "Santo reconocido por la Iglesia", emoji: "👑", description: "👼 La gente le rezará… y él dirá: “tranquilos, solo hice lo que tenía que hacer" },
        { title: "Doctor de la Iglesia", emoji: "🦉", description: "🏅 Doctor honoris causa del cielo. El Harvard celestial lo ovaciona. 🏅 Nivel jefe final. Lo que dijo, la Iglesia lo enmarca" }
    ];
    // ********************************************************************************

    // === Lógica para la conexión a Firebase y carga de datos ===
    const questionsRef = ref(db, 'questions');
    onValue(questionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const allQuestions = Object.values(data);
            
            // Filtrar preguntas por dificultad
            const preguntasFaciles = allQuestions.filter(q => q.dificultad === 'facil');
            const preguntasIntermedias = allQuestions.filter(q => q.dificultad === 'intermedio');
            const preguntasDificiles = allQuestions.filter(q => q.dificultad === 'dificil');

            // Barajar cada categoría
            shuffleArray(preguntasFaciles);
            shuffleArray(preguntasIntermedias);
            shuffleArray(preguntasDificiles);
            
            // Seleccionar 5 de cada categoría y combinarlas
            preguntas = [
                ...preguntasFaciles.slice(0, 5),
                ...preguntasIntermedias.slice(0, 5),
                ...preguntasDificiles.slice(0, 5)
            ];
            
            // Asegurarse de que hay 15 preguntas en total, si no, mostrar un mensaje de error
            if (preguntas.length < 15) {
                questionTextElement.textContent = "No hay suficientes preguntas para iniciar el juego. Se necesitan al menos 5 de cada dificultad.";
                // Deshabilitar el juego
                confirmBtn.disabled = true;
                answerButtons.forEach(btn => btn.disabled = true);
                fiftyFiftyBtn.disabled = true;
                nextQuestionBtn.disabled = true;
                pauseTimeBtn.disabled = true;
            } else {
                iniciarJuego();
            }
        } else {
            questionTextElement.textContent = "No hay preguntas disponibles. Revisa el panel de administración.";
        }
    });

    // === Lógica del Juego ===
    function iniciarJuego() {
        puntuacion = 0;
        preguntaActualIndex = 0;
        scoreDisplay.textContent = `Puntuación: 0`;
        reiniciarComodines();
        gameContainer.style.display = 'block';
        progressionScreen.style.display = 'none';
        answersContainer.style.display = 'grid';
        confirmBtn.style.display = 'block';
        endScreen.style.display = 'none';
        mostrarPregunta();
    }

    // Muestra la pantalla de progresión sin temporizador
    function mostrarPantallaProgresion() {
        clearInterval(temporizador);
        gameContainer.style.display = 'none';
        progressionScreen.style.display = 'flex';
        actualizarMarcadorProgresion();
    }
    
    // Función para actualizar el marcador de progresión
    function actualizarMarcadorProgresion() {
        progressionStepsContainer.innerHTML = '';
        niveles.forEach((nivel, index) => {
            const step = document.createElement('div');
            step.classList.add('progression-step');
            step.innerHTML = `<h4>${nivel.title} ${nivel.emoji}</h4><p>${nivel.description}</p>`;
            
            // Marca el nivel como completado si el índice es menor que la puntuación
            if (index < puntuacion) {
                step.classList.add('completed');
            }
            
            progressionStepsContainer.appendChild(step);
        });
    }

    // Función para barajar un array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Función para mostrar la pregunta y las opciones
    function mostrarPregunta() {
        if (preguntaActualIndex < preguntas.length) {
            reiniciarTemporizador();
            const pregunta = preguntas[preguntaActualIndex];
            
            questionTextElement.textContent = pregunta.pregunta;

            // Barajar las opciones para mostrarlas en un orden aleatorio
            const opcionesBarajadas = [...pregunta.opciones];
            shuffleArray(opcionesBarajadas);
            
            // Asignar las opciones barajadas a los botones, incluyendo las letras
            const letras = ['A', 'B', 'C', 'D'];
            answerButtons.forEach((btn, index) => {
                const opcion = opcionesBarajadas[index];
                btn.textContent = `${letras[index]}) ${opcion}`;
                btn.classList.remove('selected', 'correct', 'incorrect');
                btn.disabled = false;
                btn.style.display = 'block';

                // Guardar el texto original de la opción para la verificación
                btn.dataset.textoOpcion = opcion;
            });

            confirmBtn.textContent = 'Confirmar';
            confirmBtn.disabled = true;
            estadoBotonConfirmar = 'confirmar';
            esCorrecto = false; // Reinicia el estado de la respuesta
        } else {
            mostrarPantallaFinal();
        }
    }
    
    // Función para manejar la selección de respuesta
    function seleccionarRespuesta(event) {
        answerButtons.forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');
        confirmBtn.disabled = false;
    }

    // Función para revisar la respuesta del usuario
    function revisarRespuesta() {
        clearInterval(temporizador);
        const selectedBtn = document.querySelector('.answer-btn.selected');
        
        // Si no se selecciona ninguna respuesta, no hacer nada (esto debería ser manejado por el botón confirmar)
        if (!selectedBtn) return;
        
        const selectedOptionText = selectedBtn.dataset.textoOpcion;
        const pregunta = preguntas[preguntaActualIndex];
        
        answerButtons.forEach(btn => btn.disabled = true);

        // La respuesta correcta en la base de datos es una letra (A, B, C, D)
        const correctaOriginalIndex = pregunta.respuesta.charCodeAt(0) - 'A'.charCodeAt(0);
        const textoRespuestaCorrecta = pregunta.opciones[correctaOriginalIndex];
        
        if (selectedOptionText === textoRespuestaCorrecta) {
            esCorrecto = true; // Actualiza el estado de la respuesta
            puntuacion++;
            scoreDisplay.textContent = `Puntuación: ${puntuacion}`;
            selectedBtn.classList.add('correct');
        } else {
            esCorrecto = false; // Actualiza el estado de la respuesta
            selectedBtn.classList.add('incorrect');
            const correctButton = Array.from(answerButtons).find(btn => btn.dataset.textoOpcion === textoRespuestaCorrecta);
            if (correctButton) {
                correctButton.classList.add('correct');
            }
        }
        
        confirmBtn.textContent = 'Siguiente';
        confirmBtn.disabled = false;
        estadoBotonConfirmar = 'siguiente';
    }

    function pasarSiguientePregunta() {
        preguntaActualIndex++;
        if (preguntaActualIndex < preguntas.length) {
            mostrarPregunta();
        } else {
            mostrarPantallaFinal();
        }
    }

    function mostrarPantallaFinal() {
        clearInterval(temporizador);
        gameContainer.style.display = 'none';
        answersContainer.style.display = 'none';
        confirmBtn.style.display = 'none';
        endScreen.style.display = 'block';
        finalScoreSpan.textContent = puntuacion;
        questionsAnsweredSpan.textContent = preguntas.length;
        remainingTimeSpan.textContent = tiempoRestante;
    }

    function iniciarTemporizador() {
        if (!tiempoPausado) {
            temporizador = setInterval(() => {
                tiempoRestante--;
                timeElement.textContent = tiempoRestante;
                if (tiempoRestante <= 0) {
                    clearInterval(temporizador);
                    revisarRespuesta();
                }
            }, 1000);
        }
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
            // Si la respuesta fue correcta, muestra la pantalla de progresión
            if (esCorrecto) {
                mostrarPantallaProgresion();
            } else {
                // Si la respuesta fue incorrecta, avanza a la siguiente pregunta directamente
                pasarSiguientePregunta();
            }
        }
    });

    modalOkBtn.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });

    restartBtn.addEventListener('click', () => {
        iniciarJuego();
        reiniciarComodines();
    });

    // Lógica para que el botón de continuar de la pantalla de progresión avance el juego
    continueBtn.addEventListener('click', () => {
        gameContainer.style.display = 'block';
        progressionScreen.style.display = 'none';
        pasarSiguientePregunta();
    });

    // === Lógica de Comodines ===
    fiftyFiftyBtn.addEventListener('click', () => {
        if (!comodin5050Usado) {
            const pregunta = preguntas[preguntaActualIndex];
            const correctaOriginalIndex = pregunta.respuesta.charCodeAt(0) - 'A'.charCodeAt(0);
            
            const opcionesIncorrectas = Array.from(answerButtons).filter(btn => {
                const textoOpcion = btn.dataset.textoOpcion;
                const correctaOriginal = pregunta.opciones[correctaOriginalIndex];
                return textoOpcion !== correctaOriginal;
            });

            shuffleArray(opcionesIncorrectas);

            opcionesIncorrectas.slice(0, 2).forEach(btn => {
                btn.disabled = true;
                btn.textContent = ''; // Limpiar el texto
            });

            comodin5050Usado = true;
            fiftyFiftyBtn.disabled = true;
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        if (!comodinPasarPreguntaUsado) {
            pasarSiguientePregunta();
            comodinPasarPreguntaUsado = true;
            nextQuestionBtn.disabled = true;
        }
    });

    pauseTimeBtn.addEventListener('click', () => {
        if (!comodinPausarTiempoUsado) {
            if (tiempoPausado) {
                iniciarTemporizador();
                pauseTimeBtn.textContent = 'Pausar Tiempo';
            } else {
                clearInterval(temporizador);
                pauseTimeBtn.textContent = 'Continuar Tiempo';
            }
            tiempoPausado = !tiempoPausado;
            comodinPausarTiempoUsado = true;
        }
    });
});
// Variables del juego
let time = 30;
let timer;
let currentQuestionIndex = 0;
let correctAnswer = null;
let selectedAnswer = null;
let fiftyFiftyUsed = false;
let score = 0;
let answerConfirmed = false;

// Inicia el temporizador
function startTimer() {
  clearInterval(timer);
  time = 30;
  document.getElementById("time").textContent = time;
  timer = setInterval(() => {
    if (time > 0) {
      time--;
      document.getElementById("time").textContent = time;
    } else {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

// Seleccionar y ordenar preguntas
function seleccionarPreguntas() {
  mezclarPreguntas(preguntas);
  return preguntas.slice(0, 15).sort((a, b) => a.dificultad - b.dificultad);
}

// Iniciar partida
function iniciarPartida() {
  const preguntasParaPartida = seleccionarPreguntas();
  currentQuestionIndex = 0;
  score = 0;
  mostrarNuevaPregunta(preguntasParaPartida);
}

// Función para finalizar el juego
function endGame() {
  alert(`¡Se acabó el tiempo! Tu puntuación final es: ${score}`);
  disableButton("fifty-fifty");
  disableButton("pause-time");
  disableButton("next-question");
  disableButton("confirm-btn");
}

// Deshabilitar botones
function disableButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.disabled = true;
  button.style.backgroundColor = "#b0bec5";
  button.style.cursor = "not-allowed";
  button.classList.add("disabled");
}

// Mostrar nueva pregunta
function mostrarNuevaPregunta(preguntas) {
  const pregunta = preguntas[currentQuestionIndex];
  document.getElementById("question-text").textContent = pregunta.pregunta;

  pregunta.opciones.forEach((opcion, index) => {
    const btn = document.getElementById(`answer${index + 1}`);
    btn.textContent = opcion;
    btn.classList.remove("correct", "incorrect", "selected");
    btn.style.display = "inline-block";
  });

  correctAnswer = pregunta.respuesta;
  selectedAnswer = null;
  fiftyFiftyUsed = false;
  answerConfirmed = false;

  startTimer();
  const confirmButton = document.getElementById("confirm-btn");
  confirmButton.textContent = "Confirmar";
  confirmButton.onclick = () => checkAnswer(preguntas);
}

// Verificar la respuesta seleccionada
function checkAnswer(preguntas) {
  if (!selectedAnswer) {
    alert("Por favor, selecciona una respuesta.");
    return;
  }
  if (answerConfirmed) return;

  const answerButtons = document.querySelectorAll(".answer-btn");
  answerButtons.forEach(button => {
    button.classList.remove("selected");
    const answerLetter = button.textContent[0];
    if (answerLetter === correctAnswer) {
      button.classList.add("correct");
      if (selectedAnswer === correctAnswer) {
        score++;
        document.getElementById("score-display").textContent = `Puntuación: ${score}`;
      }
    } else if (answerLetter === selectedAnswer) {
      button.classList.add("incorrect");
    }
  });

  clearInterval(timer);
  convertirBotonASiguiente();
}

// Convertir el botón "Confirmar" en "Siguiente Pregunta"
function convertirBotonASiguiente() {
  const confirmButton = document.getElementById("confirm-btn");
  confirmButton.textContent = "Siguiente Pregunta";
  confirmButton.onclick = cargarSiguientePregunta;
  answerConfirmed = true;
}

// Cargar siguiente pregunta
function cargarSiguientePregunta() {
  if (currentQuestionIndex < 14) { // Esto asegura que el juego termine en la pregunta 15
    currentQuestionIndex++;
    mostrarNuevaPregunta(preguntas);
  } else {
    endGame(); // Finaliza el juego después de 15 preguntas
  }
}



// Reiniciar juego
function reiniciarJuego() {
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById("score-display").textContent = `Puntuación: ${score}`;
  mostrarNuevaPregunta(preguntas); // Reinicia el juego mostrando la primera pregunta
}


// Mezclar preguntas
function mezclarPreguntas() {
  for (let i = preguntas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]];
  }
}

// Evento para 50/50
document.getElementById("fifty-fifty").addEventListener("click", function () {
  if (fiftyFiftyUsed) return;

  const botonesRespuesta = document.querySelectorAll(".answer-btn");
  const respuestasIncorrectas = Array.from(botonesRespuesta).filter(button => button.textContent[0] !== correctAnswer);
  for (let i = 0; i < 2; i++) {
    const randomIndex = Math.floor(Math.random() * respuestasIncorrectas.length);
    respuestasIncorrectas[randomIndex].style.display = "none";
    respuestasIncorrectas.splice(randomIndex, 1);
  }

  fiftyFiftyUsed = true;
  disableButton("fifty-fifty");
});

// Pausar o reanudar el temporizador
document.getElementById("pause-time").addEventListener("click", function () {
  if (timer) {
    clearInterval(timer);
    timer = null;
    this.textContent = "Pausar Tiempo";
  } else {
    startTimer();
    this.textContent = "Pausar Tiempo";
  }
  
  // Deshabilitar el botón después de usarlo
  disableButton("pause-time");
});

// Función para deshabilitar un botón
function disableButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.disabled = true;
  button.style.backgroundColor = "#b0bec5";  // Cambia el color del botón a un gris para indicar que está deshabilitado
  button.style.cursor = "not-allowed";  // Cambia el cursor para mostrar que el botón no es clickeable
  button.classList.add("disabled"); // Puedes agregar una clase si quieres personalizar más el estilo
}

// Función para deshabilitar botones después de usarlos
document.getElementById("next-question").addEventListener("click", function () {
  disableButton("next-question");
});

// Seleccionar respuesta
const answerButtons = document.querySelectorAll(".answer-btn");
answerButtons.forEach(button => {
  button.addEventListener("click", () => {
    answerButtons.forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedAnswer = button.textContent[0];
  });
});




// Función para finalizar el juego
function endGame() {
  clearInterval(timer); // Detener el temporizador

  // Ocultar el contenedor del juego
  document.getElementById("game-container").style.display = "none";
  
  // Mostrar la pantalla de fin del juego
  const endScreen = document.getElementById("end-screen");
  endScreen.style.display = "block";
  
  // Actualizar el mensaje de fin del juego
  document.getElementById("final-score").textContent = `Puntuación final: ${score}`;
  document.getElementById("questions-answered").textContent = `Preguntas respondidas: ${currentQuestionIndex + 1}`;
  document.getElementById("time-remaining").textContent = `Tiempo restante: ${time} segundos`;
}



// Iniciar el juego
iniciarPartida();
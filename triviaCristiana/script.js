// Variables del juego
let time = 30; 
let timer;
let currentQuestionIndex = 0; 
let correctAnswer = null; 
let selectedAnswer = null;
let fiftyFiftyUsed = false; 
let score = 0; 
let answerConfirmed = false; 
const totalQuestions = 15; // Número total de preguntas por partida
let selectedQuestions = []; // Array para almacenar las preguntas seleccionadas

// Función para mezclar un array (algoritmo de Fisher-Yates)
function mezclarPreguntas(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Función para seleccionar preguntas
function seleccionarPreguntas() {
  const preguntasPorNivel = {};

  // Agrupar preguntas por nivel
  preguntas.forEach(pregunta => {
    if (!preguntasPorNivel[pregunta.nivel]) {
      preguntasPorNivel[pregunta.nivel] = [];
    }
    preguntasPorNivel[pregunta.nivel].push(pregunta);
  });

  // Seleccionar preguntas de cada nivel hasta completar 15
  for (let nivel = 1; nivel <= Object.keys(preguntasPorNivel).length; nivel++) {
    if (selectedQuestions.length < totalQuestions && preguntasPorNivel[nivel]) {
      const preguntasNivel = preguntasPorNivel[nivel];
      // Mezclar las preguntas de este nivel
      mezclarPreguntas(preguntasNivel);
      // Agregar hasta 15 preguntas
      selectedQuestions.push(...preguntasNivel.slice(0, totalQuestions - selectedQuestions.length));
    }
  }

  // Mezclar las preguntas seleccionadas para que el orden sea aleatorio
  mezclarPreguntas(selectedQuestions);
}

// Llamar a seleccionarPreguntas() al inicio del juego
seleccionarPreguntas();

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
      endGame(); // Llama a endGame cuando el tiempo se acaba
    }
  }, 1000);
}

// Función para finalizar el juego
function endGame() {
  // Muestra el mensaje de fin de juego con la puntuación final
  alert(`¡Se acabó el tiempo! Tu puntuación final es: ${score}`);
  // Deshabilitar todos los botones
  disableButton("fifty-fifty");
  disableButton("pause-time");
  disableButton("next-question");
  disableButton("confirm-btn");  // Deshabilita el botón de "Confirmar"
}

// Mostrar una nueva pregunta
function mostrarNuevaPregunta() {
  if (currentQuestionIndex >= totalQuestions) {
    endGame(); // Termina el juego si ya se han mostrado todas las preguntas
    return;
  }

  const pregunta = selectedQuestions[currentQuestionIndex];
  document.getElementById("question-text").textContent = pregunta.pregunta;

  // Mostrar las opciones de respuesta
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

  // Reiniciar el temporizador
  startTimer();
  
  // Restablecer el botón "Confirmar"
  const confirmButton = document.getElementById("confirm-btn");
  confirmButton.textContent = "Confirmar";
  confirmButton.onclick = checkAnswer; // Asigna la función de confirmar respuesta
  
  // Actualizar la barra de progreso
  updateProgressBar();
}

// Función para actualizar la barra de progreso
function updateProgressBar() {
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const percentage = ((currentQuestionIndex + 1) / totalQuestions) * 100; // +1 porque currentQuestionIndex empieza en 0
  progressBar.style.width = percentage + "%";
  progressText.textContent = `${currentQuestionIndex + 1} de ${totalQuestions} preguntas respondidas`;
}

// Detectar la selección de respuesta
const answerButtons = document.querySelectorAll(".answer-btn");
answerButtons.forEach(button => {
  button.addEventListener("click", () => {
    answerButtons.forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedAnswer = button.textContent[0]; 
  });
});

// Verifica la respuesta seleccionada
function checkAnswer() {
  if (!selectedAnswer) {
    alert("Por favor, selecciona una respuesta.");
    return;
  }
  if (answerConfirmed) return; // Evita la doble confirmación de la respuesta
  answerButtons.forEach(button => {
    button.classList.remove("selected");
    const answerLetter = button.textContent[0];
    if (answerLetter === correctAnswer) {
      button.classList.add("correct");
      // **Sumar punto si la respuesta es correcta**
      if (selectedAnswer === correctAnswer && !answerConfirmed) {
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

// Convierte el botón de "Confirmar" en "Siguiente Pregunta"
function convertirBotonASiguiente() {
  const confirmButton = document.getElementById("confirm-btn");
  confirmButton.textContent = "Siguiente Pregunta";
  confirmButton.onclick = cargarSiguientePregunta; 
  answerConfirmed = true; 
}

// Carga la siguiente pregunta
function cargarSiguientePregunta() {
  if (currentQuestionIndex < totalQuestions - 1) {
    currentQuestionIndex++;
    mostrarNuevaPregunta(); // Mostrar la nueva pregunta
  } else {
    alert(`¡Has terminado el juego! Tu puntuación final es: ${score}`);
    reiniciarJuego(); // O simplemente reinicia el juego si lo prefieres
  }
}

// Función para reiniciar el juego
function reiniciarJuego() {
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById("score-display").textContent = `Puntuación: ${score}`; 
  seleccionarPreguntas(); // Selecciona nuevas preguntas
  mostrarNuevaPregunta();
}

// Función para 50/50
document.getElementById("fifty-fifty").addEventListener("click", () => {
  if (fiftyFiftyUsed) return; 
  const botonesRespuesta = document.querySelectorAll(".answer-btn");
  const respuestasIncorrectas = Array.from(botonesRespuesta).filter(button => button.textContent[0] !== correctAnswer);
  for (let i = 0; i < 2; i++) {
    const randomIndex = Math.floor(Math.random() * respuestasIncorrectas.length);
    respuestasIncorrectas[randomIndex].style.display = "none"; 
    respuestasIncorrectas.splice(randomIndex, 1);
  }
  fiftyFiftyUsed = true; 
});

// Pausar o reanudar el temporizador
document.getElementById("pause-time").addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    document.getElementById("pause-time").textContent = "Reanudar Tiempo"; 
  } else {
    startTimer();
    document.getElementById("pause-time").textContent = "Pausar Tiempo"; 
  }
});

// Función para deshabilitar un botón
function disableButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.disabled = true;
  button.style.backgroundColor = "#b0bec5";  // Cambia el color del botón a un gris para indicar que está deshabilitado
  button.style.cursor = "not-allowed";  // Cambia el cursor para mostrar que el botón no es clickeable
  button.classList.add("disabled"); // Puedes agregar una clase si quieres personalizar más el estilo
}

// Asignar los botones para deshabilitarlos después de usarlos
document.getElementById("fifty-fifty").addEventListener("click", function() {
  disableButton("fifty-fifty");
});
document.getElementById("pause-time").addEventListener("click", function() {
  disableButton("pause-time");
});
document.getElementById("next-question").addEventListener("click", function() {
  cargarSiguientePregunta(); // Asegúrate de que esta función esté definida
  disableButton("next-question"); // Deshabilitar el botón después de usarlo (opcional)
});

// Inicia el juego con la primera pregunta
mostrarNuevaPregunta();
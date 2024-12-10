// Variables del juego
let time = 30; // Tiempo inicial en segundos
let timer;
let currentQuestionIndex = 0; // Índice de la pregunta actual
let correctAnswer = null; // Respuesta correcta dinámica según la pregunta
let selectedAnswer = null;
let fiftyFiftyUsed = false; // Para evitar usar 50/50 más de una vez

// Inicia el temporizador
function startTimer() {
  timer = setInterval(() => {
    if (time > 0) {
      time--;
      document.getElementById("time").textContent = time; // Mostrar tiempo restante
    } else {
      clearInterval(timer);
      alert("¡Se acabó el tiempo!"); // Notificar cuando el tiempo se agote
    }
  }, 1000);
}

// Función para mostrar una nueva pregunta
function mostrarNuevaPregunta() {
  const pregunta = preguntas[currentQuestionIndex];
  document.getElementById("question-text").textContent = pregunta.pregunta;
  
  // Mostrar las opciones de respuesta
  pregunta.opciones.forEach((opcion, index) => {
    const btn = document.getElementById(`answer${index + 1}`);
    btn.textContent = opcion;
    btn.classList.remove("correct", "incorrect", "selected");  // Limpiar clases previas
    btn.style.display = "inline-block";  // Asegurarse que todas las opciones se muestren inicialmente
  });

  correctAnswer = pregunta.respuesta;  // Establecer la respuesta correcta
  selectedAnswer = null;  // Reiniciar la selección del usuario
  fiftyFiftyUsed = false; // Reiniciar el estado del 50/50

  // Reiniciar el temporizador
  time = 30;
  document.getElementById("time").textContent = time;
  clearInterval(timer);  // Limpiar cualquier temporizador anterior
  startTimer();  // Iniciar un nuevo temporizador
}

// Detectar la selección de respuesta
const answerButtons = document.querySelectorAll(".answer-btn");
answerButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Remover la clase 'selected' de todas las respuestas antes de marcar la nueva
    answerButtons.forEach(btn => btn.classList.remove("selected"));
    
    // Marcar la respuesta seleccionada
    button.classList.add("selected");
    selectedAnswer = button.textContent[0]; // Usar la primera letra (A, B, C, D) como identificador
  });
});

// Función para verificar la respuesta seleccionada
function checkAnswer() {
  if (!selectedAnswer) {
    alert("Por favor, selecciona una respuesta.");
    return;
  }

  // Primero, eliminar la clase 'selected' de todos los botones de respuesta
  answerButtons.forEach(button => {
    button.classList.remove("selected");
  });

  // Marcar las respuestas como correctas o incorrectas
  answerButtons.forEach(button => {
    const answerLetter = button.textContent[0]; // A, B, C, D
    
    // Respuesta correcta
    if (answerLetter === correctAnswer) {
      button.classList.add("correct");
    }
    // Respuesta seleccionada incorrecta
    else if (answerLetter === selectedAnswer && answerLetter !== correctAnswer) {
      button.classList.add("incorrect");
    }
  });

  // Detener el temporizador al mostrar la respuesta
  clearInterval(timer);
}



// Añadir evento para el botón de confirmación de respuesta
document.getElementById("confirm-btn").addEventListener("click", checkAnswer);

// Función para el 50/50
document.getElementById("fifty-fifty").addEventListener("click", () => {
  if (fiftyFiftyUsed) {
    return; // Si ya se usó el 50/50, no hace nada sin mostrar alerta
  }
  
  // Eliminar dos respuestas incorrectas (simulación)
  const botonesRespuesta = document.querySelectorAll(".answer-btn");
  const respuestasIncorrectas = [];

  // Recopilar las respuestas incorrectas
  botonesRespuesta.forEach((button, index) => {
    const answerLetter = button.textContent[0]; // A, B, C, D
    if (answerLetter !== correctAnswer) {
      respuestasIncorrectas.push(button);
    }
  });

  // Seleccionar aleatoriamente dos respuestas incorrectas para ocultar
  for (let i = 0; i < 2; i++) {
    const randomIndex = Math.floor(Math.random() * respuestasIncorrectas.length);
    const respuestaAEliminar = respuestasIncorrectas.splice(randomIndex, 1)[0];
    respuestaAEliminar.style.display = "none"; // Ocultar la respuesta incorrecta
  }

  fiftyFiftyUsed = true; // Marcar que se ha usado el 50/50
});

// Función para cambiar la pregunta o terminar el juego
document.getElementById("next-question").addEventListener("click", () => {
  if (currentQuestionIndex < preguntas.length - 1) {
    currentQuestionIndex++;
    mostrarNuevaPregunta();  // Mostrar siguiente pregunta
  } else {
    alert("¡Has terminado el juego!");
  }
});

// Función para pausar el temporizador
document.getElementById("pause-time").addEventListener("click", () => {
  if (timer) {
    clearInterval(timer); // Pausar el temporizador
    timer = null; // Desactivar el temporizador
    document.getElementById("pause-time").textContent = "Reanudar Tiempo"; // Cambiar texto
  } else {
    startTimer(); // Reanudar el temporizador
    document.getElementById("pause-time").textContent = "Pausar Tiempo"; // Cambiar texto
  }
});

// Iniciar el juego con la primera pregunta
mostrarNuevaPregunta();

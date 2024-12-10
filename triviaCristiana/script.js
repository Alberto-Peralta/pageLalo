



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
      alert("¡Se acabó el tiempo!"); 
      convertirBotonASiguiente();
    }
  }, 1000);
}

// Muestra una nueva pregunta
function mostrarNuevaPregunta() {
  const pregunta = preguntas[currentQuestionIndex];
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
  if (currentQuestionIndex < preguntas.length - 1) {
    currentQuestionIndex++;
    mostrarNuevaPregunta();
  } else {
    alert(`¡Has terminado el juego! Tu puntuación final es: ${score}`);
    reiniciarJuego();
  }
}



// Función para reiniciar el juego
function reiniciarJuego() {
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById("score-display").textContent = `Puntuación: ${score}`; 
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



document.getElementById("next-question").addEventListener("click", () => {
  // Sumar un punto como si la respuesta fuera correcta
  score++;

  // Actualizar la puntuación en pantalla
  document.getElementById("score-display").textContent = `Puntuación: ${score}`;

  // Avanzar a la siguiente pregunta
  if (currentQuestionIndex < preguntas.length - 1) {
    currentQuestionIndex++;
    mostrarNuevaPregunta();  // Mostrar la nueva pregunta
  } else {
    alert(`¡Has terminado el juego! Tu puntuación final es: ${score}`);
    // Aquí podrías reiniciar el juego o redirigir a otra parte
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
  // Aquí agregarías la lógica para usar el comodín 50/50
  disableButton("fifty-fifty");
});

document.getElementById("pause-time").addEventListener("click", function() {
  // Aquí agregarías la lógica para pausar el tiempo
  disableButton("pause-time");
});

document.getElementById("next-question").addEventListener("click", function() {
  // Aquí agregarías la lógica para pasar a la siguiente pregunta
  disableButton("next-question");
});

 
// Inicia el juego con la primera pregunta
mostrarNuevaPregunta();

// Base de datos de preguntas
const preguntas = [
  { pregunta: "¿Cuál es la capital de Francia?", opciones: ["A) Berlín", "B) Madrid", "C) París", "D) Roma"], respuesta: "C", genero: "Geografía" },
  { pregunta: "¿Cuál es el resultado de 5 + 3?", opciones: ["A) 6", "B) 7", "C) 8", "D) 9"], respuesta: "C", genero: "Matemáticas" },
  { pregunta: "¿Quién escribió 'Don Quijote'?", opciones: ["A) Cervantes", "B) Shakespeare", "C) Garcilaso", "D) Lope de Vega"], respuesta: "A", genero: "Literatura" },
  { pregunta: "¿Qué gas constituye el 78% de la atmósfera terrestre?", opciones: ["A) Oxígeno", "B) Nitrógeno", "C) Hidrógeno", "D) Carbono"], respuesta: "B", genero: "Ciencias" },
  { pregunta: "¿Quién pintó la Mona Lisa?", opciones: ["A) Picasso", "B) Da Vinci", "C) Van Gogh", "D) Rembrandt"], respuesta: "B", genero: "Arte" },
  { pregunta: "¿En qué año llegó el hombre a la Luna?", opciones: ["A) 1961", "B) 1969", "C) 1957", "D) 1972"], respuesta: "B", genero: "Historia" },
  { pregunta: "¿Cómo se llama el río más largo del mundo?", opciones: ["A) Amazonas", "B) Nilo", "C) Misisipi", "D) Yangtsé"], respuesta: "A", genero: "Geografía" },
  { pregunta: "¿Cuál es el elemento químico con el símbolo O?", opciones: ["A) Oxígeno", "B) Oregano", "C) Osmio", "D) Oro"], respuesta: "A", genero: "Ciencias" },
  { pregunta: "¿Quién es el autor de 'Cien años de soledad'?", opciones: ["A) García Márquez", "B) Borges", "C) Cortázar", "D) Neruda"], respuesta: "A", genero: "Literatura" },
  { pregunta: "¿Qué es la fotosíntesis?", opciones: ["A) El proceso de respiración de las plantas", "B) La formación de nubes", "C) El proceso en que las plantas convierten la luz en energía", "D) El proceso de crecimiento de las plantas"], respuesta: "C", genero: "Ciencias" },
  { pregunta: "¿En qué país nació el cine?", opciones: ["A) Alemania", "B) Francia", "C) Estados Unidos", "D) Italia"], respuesta: "B", genero: "Historia" },
  { pregunta: "¿Qué continente es el más grande?", opciones: ["A) África", "B) Asia", "C) América", "D) Europa"], respuesta: "B", genero: "Geografía" },
  { pregunta: "¿Cuántos planetas hay en el sistema solar?", opciones: ["A) 7", "B) 8", "C) 9", "D) 10"], respuesta: "B", genero: "Ciencias" },
  { pregunta: "¿Cuál es el idioma oficial de Brasil?", opciones: ["A) Español", "B) Portugués", "C) Italiano", "D) Francés"], respuesta: "B", genero: "Geografía" },
  { pregunta: "¿Qué animal es conocido por su lentitud?", opciones: ["A) Tortuga", "B) León", "C) Cebra", "D) Elefante"], respuesta: "A", genero: "Biología" },
  { pregunta: "¿Cuál es el sistema operativo más utilizado?", opciones: ["A) Windows", "B) MacOS", "C) Linux", "D) Android"], respuesta: "A", genero: "Tecnología" }
];

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

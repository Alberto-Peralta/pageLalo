// Importaciones de Firebase (modular v9+) - ACTUALIZADO
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    set, 
    push, 
    remove, 
    get,
    query,
    orderByChild, 
    limitToLast,
    limitToFirst
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js"; // ← SOLO ESTA LÍNEA



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

    const saveScoreBtn = document.getElementById('save-score-btn');
    const saveScoreForm = document.getElementById('save-score-form');
    const viewRankingBtn = document.getElementById('view-ranking-btn');
    const rankingScreen = document.getElementById('ranking-screen');
    const rankingList = document.getElementById('ranking-list');
    const backToGameBtn = document.getElementById('back-to-game-btn');
    const playerAliasInput = document.getElementById('player-alias');      
    
    
        // Elementos de la nueva pantalla de inicio
    const startScreen = document.getElementById('start-screen');
    const startGameBtn = document.getElementById('start-game-btn'); // ← ESTA LÍNEA
    const viewRankingBtnStart = document.getElementById('view-ranking-btn-start');
    const backToStartBtn = document.getElementById('back-to-start-btn');
    
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

      // Agregar timeout para conexión (15 segundos)
      const connectionTimeout = setTimeout(() => {
          console.error("Timeout de conexión a Firebase");
          questionTextElement.textContent = "Error de conexión. Verifica tu internet e intenta recargar la página.";
      }, 15000);

      onValue(questionsRef, (snapshot) => {
          // Limpiar el timeout si la conexión es exitosa
          clearTimeout(connectionTimeout);
          
          const data = snapshot.val();
          if (data) {
              try {
                  const allQuestions = Object.values(data);
                  
                  // Filtrar preguntas por dificultad
                  const preguntasFaciles = allQuestions.filter(q => q.dificultad === 'facil');
                  const preguntasIntermedias = allQuestions.filter(q => q.dificultad === 'intermedio');
                  const preguntasDificiles = allQuestions.filter(q => q.dificultad === 'dificil');

                  // Barajar cada categoría
                  shuffleArray(preguntasFaciles);
                  shuffleArray(preguntasIntermedias);
                  shuffleArray(preguntasDificiles);
                  
                  // ✅ CORREGIDO: Seleccionar 5 de cada categoría en ORDEN
                  preguntas = [];
                  
                  // Primeras 5: Fáciles (0-4)
                  for (let i = 0; i < 5 && i < preguntasFaciles.length; i++) {
                      preguntas.push(preguntasFaciles[i]);
                  }
                  
                  // Siguientes 5: Intermedias (5-9)
                  for (let i = 0; i < 5 && i < preguntasIntermedias.length; i++) {
                      preguntas.push(preguntasIntermedias[i]);
                  }
                  
                  // Últimas 5: Difíciles (10-14)
                  for (let i = 0; i < 5 && i < preguntasDificiles.length; i++) {
                      preguntas.push(preguntasDificiles[i]);
                  }
                  
                  console.log("✅ Preguntas cargadas en orden:", 
                      preguntas.map((p, i) => `${i + 1}:${p.dificultad.charAt(0)}`).join(" "));
                  
                  // Asegurarse de que hay 15 preguntas en total
                  if (preguntas.length < 15) {
                      console.warn("Solo hay", preguntas.length, "preguntas disponibles");
                      questionTextElement.textContent = `Solo hay ${preguntas.length} preguntas disponibles. Agrega más en el panel de administración.`;
                  } else {
                          iniciarJuego(); // ← Sin parámetro
                      }
                  
              } catch (error) {
                  console.error("Error procesando preguntas:", error);
                  questionTextElement.textContent = "Error al procesar las preguntas.";
              }
          } else {
              questionTextElement.textContent = "No hay preguntas disponibles. Agrega preguntas en el panel de administración.";
          }
      }, (error) => {
          // Manejar error de conexión
          clearTimeout(connectionTimeout);
          console.error("Error de Firebase:", error);
          questionTextElement.textContent = "Error de conexión con Firebase. Verifica las reglas de la base de datos.";
      });


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
            
            // --- MODIFICACIÓN AQUÍ ---
           // Añade el emoji de la biblia como marcador del nivel ACTUAL (recientemente alcanzado)
            const isCurrentLevel = (index === puntuacion - 1 && puntuacion > 0); // <--- ESTA ES LA LÍNEA CORREGIDA
            const bibleEmojiMarker = isCurrentLevel ? '<span class="bible-marker">📖</span>' : '';
            step.innerHTML = `${bibleEmojiMarker}<h4>${nivel.title} ${nivel.emoji}</h4><p>${nivel.description}</p>`;
            
            // Marca el nivel como completado si el índice es menor que la puntuación
            if (index < puntuacion) {
                step.classList.add('completed');
            }
            
            // Añade una clase especial al nivel recién completado para la animación
            if (index === puntuacion - 1) {
                step.classList.add('newly-completed');
            }
            // --- FIN DE LA MODIFICACIÓN ---

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
            console.log("Índice actual:", preguntaActualIndex, "Total preguntas:", preguntas.length); // Debug
            
            if (preguntaActualIndex < preguntas.length) {
                mostrarPregunta();
            } else {
                console.log("Mostrando pantalla final"); // Debug
                mostrarPantallaFinal();
            }
        }

       function mostrarPantallaFinal() {
    console.log("🔴 EJECUTANDO mostrarPantallaFinal()");
    
    clearInterval(temporizador);
    
    // Actualizar la UI
    finalScoreSpan.textContent = puntuacion;
    questionsAnsweredSpan.textContent = preguntaActualIndex;
    remainingTimeSpan.textContent = tiempoRestante;
    
    // Mostrar mensaje especial si fue partida perfecta
    if (puntuacion === 15 && preguntaActualIndex === 15) {
        const perfectMessage = document.createElement('p');
        perfectMessage.textContent = '🎉 ¡PARTIDA PERFECTA! 🎉';
        perfectMessage.style.color = '#ffcc00';
        perfectMessage.style.fontWeight = 'bold';
        perfectMessage.style.fontSize = '1.5rem';
        endScreen.insertBefore(perfectMessage, saveScoreForm);
    }
    
    // Resetear formulario de ranking
    playerAliasInput.value = '';
    saveScoreForm.style.display = 'block';
    viewRankingBtn.style.display = 'none';
    
    // Mostrar/ocultar elementos
    gameContainer.style.display = 'none';
    progressionScreen.style.display = 'none';
    endScreen.style.display = 'flex';
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
    if (!tiempoPausado) {
        iniciarTemporizador();
    }
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
          endScreen.style.display = 'none'; // Ocultar pantalla final primero
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


     // Event listeners para la pantalla de inicio
          startGameBtn.addEventListener('click', () => {
              startScreen.style.display = 'none';
              iniciarJuego(true); // ← Pasar true aquí
          });


          viewRankingBtnStart.addEventListener('click', () => {
              startScreen.style.display = 'none';
              rankingScreen.style.display = 'block';
              cargarRanking();
          });



          backToStartBtn.addEventListener('click', () => {
              rankingScreen.style.display = 'none';
              startScreen.style.display = 'flex';
          });

                      function iniciarJuego(fromStartScreen = false) {
                if (fromStartScreen && typeof startScreen !== 'undefined') {
                    startScreen.style.display = 'none';
                }
                
                puntuacion = 0;
                preguntaActualIndex = 0;
                scoreDisplay.textContent = `Puntuación: 0`;
                reiniciarComodines();
                gameContainer.style.display = 'block';
                progressionScreen.style.display = 'none';
                answersContainer.style.display = 'grid';
                confirmBtn.style.display = 'block';
                endScreen.style.display = 'none';
                
                // SOLO mostrar pregunta si hay preguntas cargadas
                if (preguntas.length > 0) {
                    mostrarPregunta();
                } else {
                    questionTextElement.textContent = "No hay preguntas disponibles.";
                }
            }

              // AGREGA esta función
          async function guardarPuntuacion() {
    const alias = playerAliasInput.value.trim();
    if (!alias) {
        mostrarAlerta("Por favor, escribe un alias");
        return;
    }

    // Calcular si fue partida perfecta
        const partidaPerfecta = (puntuacion === 15 && preguntaActualIndex === 15);
        
        const scoreData = {
            alias: alias,
            puntuacion: puntuacion,
            preguntasRespondidas: preguntaActualIndex,
            tiempoRestante: tiempoRestante,
            partidaPerfecta: partidaPerfecta, // ← NUEVO CAMPO
            partidasGanadas: partidaPerfecta ? 1 : 0, // ← NUEVO CAMPO
            fecha: new Date().toISOString(),
            timestamp: Date.now()
        };

        try {
            await push(ref(db, 'rankings'), scoreData);
            mostrarAlerta("✅ Puntuación guardada en el ranking");
            saveScoreForm.style.display = 'none';
            viewRankingBtn.style.display = 'block';
        } catch (error) {
            console.error("Error al guardar puntuación:", error);
            mostrarAlerta("Error al guardar puntuación");
        }
    }



          function cargarRanking() {
          const rankingsRef = ref(db, 'rankings');
          const topRankingsQuery = query(rankingsRef, orderByChild('puntuacion'), limitToLast(20));
          
          onValue(topRankingsQuery, (snapshot) => {
              const data = snapshot.val();
              rankingList.innerHTML = '';
              
              if (data) {
                  const rankingsArray = Object.entries(data)
                      .map(([key, value]) => ({ id: key, ...value }))
                      .sort((a, b) => b.puntuacion - a.puntuacion || b.tiempoRestante - a.tiempoRestante);
                  
                  // Contar partidas perfectas por jugador
                  const jugadoresConPerfectas = {};
                  rankingsArray.forEach(score => {
                      if (score.partidaPerfecta) {
                          if (!jugadoresConPerfectas[score.alias]) {
                              jugadoresConPerfectas[score.alias] = 0;
                          }
                          jugadoresConPerfectas[score.alias]++;
                      }
                  });
                  
                  rankingsArray.forEach((score, index) => {
                      const rankItem = document.createElement('div');
                      rankItem.className = 'rank-item';
                      
                      const partidasPerfectas = jugadoresConPerfectas[score.alias] || 0;
                      const esPerfecta = score.partidaPerfecta ? '🏆 PERFECTA!' : '';
                      
                      rankItem.innerHTML = `
                          <span class="rank-position">${index + 1}º</span>
                          <span class="rank-alias">${score.alias}</span>
                          <span class="rank-score">${score.puntuacion}/15 pts</span>
                          <span class="rank-perfectas">⭐ ${partidasPerfectas}</span>
                          <span class="rank-time">⏱️ ${score.tiempoRestante}s</span>
                          <span class="rank-perfect-badge">${esPerfecta}</span>
                      `;
                      
                      // Destacar partidas perfectas
                      if (score.partidaPerfecta) {
                          rankItem.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)';
                          rankItem.style.color = '#003366';
                          rankItem.style.fontWeight = 'bold';
                      }
                      
                      rankingList.appendChild(rankItem);
                  });
              } else {
                  rankingList.innerHTML = '<p>No hay puntuaciones aún</p>';
              }
          });
      }

                saveScoreBtn.addEventListener('click', guardarPuntuacion);
        viewRankingBtn.addEventListener('click', () => {
            endScreen.style.display = 'none';
            rankingScreen.style.display = 'block';
            cargarRanking();
        });
        backToGameBtn.addEventListener('click', () => {
            rankingScreen.style.display = 'none';
            endScreen.style.display = 'block';
        });
        playerAliasInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                guardarPuntuacion();
            }
        });       


        function mostrarEstadisticasPerfectas() {
    const rankingsRef = ref(db, 'rankings');
    
    onValue(rankingsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const rankingsArray = Object.values(data);
            const partidasPerfectasTotales = rankingsArray.filter(score => score.partidaPerfecta).length;
            
            // Mostrar en alguna parte de la UI
            console.log(`Partidas perfectas totales: ${partidasPerfectasTotales}`);
        }
    });
}

// Llamar esta función cuando sea necesario

});
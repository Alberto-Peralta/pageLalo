<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App de Intenciones con Firebase</title>
    <script src="https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(90deg, #4b6cb7 0%, #182848 100%);
            color: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .card {
            background-color: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn {
            background: linear-gradient(90deg, #4b6cb7 0%, #182848 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .intention-item {
            border-left: 4px solid #4b6cb7;
            transition: transform 0.2s ease;
        }
        .intention-item:hover {
            transform: translateX(5px);
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4b6cb7;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="text-3xl font-bold text-center">App de Intenciones</h1>
            <p class="text-center mt-2">Comparte tus intenciones y ve las de otros usuarios en tiempo real</p>
        </div>

        <div class="card">
            <h2 class="text-xl font-semibold mb-4">Tu información</h2>
            <p id="user-info" class="text-gray-700">Cargando...</p>
        </div>

        <div class="card">
            <h2 class="text-xl font-semibold mb-4">Comparte tu intención</h2>
            <form id="intention-form">
                <textarea 
                    id="intention-text" 
                    placeholder="Escribe tu intención aquí..." 
                    class="w-full p-3 border border-gray-300 rounded-lg mb-3" 
                    rows="3"
                    required
                ></textarea>
                <button type="submit" class="btn w-full">Enviar Intención</button>
            </form>
        </div>

        <div class="card">
            <h2 class="text-xl font-semibold mb-4">Intenciones de la comunidad</h2>
            <div id="loading-message" class="loading">
                <div class="spinner"></div>
            </div>
            <div id="intentions-list" class="space-y-3">
                <!-- Las intenciones se cargarán aquí -->
            </div>
        </div>
    </div>

    <div id="message-modal" class="modal">
        <div class="modal-content">
            <h3 class="text-xl font-semibold mb-3">Mensaje</h3>
            <p id="modal-text"></p>
            <button onclick="document.getElementById('message-modal').style.display='none'" class="btn mt-4">Cerrar</button>
        </div>
    </div>

    <script>
        // Configuración de Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
            authDomain: "pagelalo-1b210.firebaseapp.com",
            projectId: "pagelalo-1b210",
            storageBucket: "pagelalo-1b210.firebasestorage.app",
            messagingSenderId: "1096735980204",
            appId: "1:1096735980204:web:8252ddb9fb484c398dfd09"
        };

        // Inicializar Firebase
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Variables globales
        let userId = null;
        const appId = 'intenciones-app';

        // Funciones globales para manejar el estado del UI
        function showMessageModal(message) {
            const modal = document.getElementById('message-modal');
            const modalText = document.getElementById('modal-text');
            if (modal && modalText) {
                modalText.textContent = message;
                modal.style.display = 'flex';
            }
        }

        // Inicialización de Firebase
        async function initializeFirebase() {
            try {
                // Usar autenticación anónima
                await auth.signInAnonymously();
                
                // Escuchar cambios en el estado de autenticación
                auth.onAuthStateChanged(user => {
                    if (user) {
                        userId = user.uid;
                        document.getElementById('user-info').textContent = `Tu ID de usuario es: ${userId}`;
                        // Cargar las intenciones después de la autenticación
                        fetchIntentions();
                    } else {
                        console.log("Usuario no autenticado. Usando ID anónimo.");
                        userId = 'anonymous-' + Math.random().toString(36).substring(2, 9);
                        document.getElementById('user-info').textContent = `ID Anónimo: ${userId}`;
                        // Cargar intenciones incluso para usuarios anónimos
                        fetchIntentions();
                    }
                });

            } catch (error) {
                console.error('Error al inicializar Firebase:', error);
                document.getElementById('loading-message').textContent = 'Error al cargar. Revisa la consola para más detalles.';
                showMessageModal(`Error: ${error.message}`);
            }
        }

        // Lógica para enviar una nueva intención a Firestore
        function setupFormSubmission() {
            const intentionForm = document.getElementById('intention-form');
            const intentionText = document.getElementById('intention-text');
            
            if (intentionForm) {
                intentionForm.addEventListener('submit', async (e) => {
                    e.preventDefault(); // Evita que la página se recargue
                    const text = intentionText.value.trim();

                    if (text) {
                        try {
                            await db.collection('intenciones').add({
                                text: text,
                                userId: userId,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            intentionText.value = ''; // Limpia el área de texto
                        } catch (error) {
                            console.error("Error al guardar la intención:", error);
                            showMessageModal(`Error: ${error.message}. No se pudo enviar la intención.`);
                        }
                    }
                });
            }
        }

        // Lógica para leer las intenciones de Firestore en tiempo real
        function fetchIntentions() {
            const intentionsList = document.getElementById('intentions-list');
            if (!db || !intentionsList) {
                return; // Salir si la base de datos o la lista no están listas
            }
            
            // Esconder el mensaje de carga
            document.getElementById('loading-message').style.display = 'none';

            try {
                db.collection('intenciones')
                    .orderBy('timestamp', 'desc')
                    .onSnapshot((snapshot) => {
                        intentionsList.innerHTML = ''; // Limpia la lista actual
                        if (snapshot.empty) {
                            intentionsList.innerHTML = '<p class="text-gray-500 text-center">Todavía no hay intenciones. ¡Sé el primero en enviar una!</p>';
                        } else {
                            snapshot.forEach((doc) => {
                                const intention = doc.data();
                                const item = document.createElement('div');
                                item.className = 'intention-item p-4 bg-white rounded-lg shadow-sm';
                                item.innerHTML = `
                                    <p class="text-gray-800 text-lg font-medium mb-1">"${intention.text}"</p>
                                    <small class="text-gray-500">Por usuario: ${intention.userId}</small>
                                `;
                                intentionsList.appendChild(item);
                            });
                        }
                    }, (error) => {
                        console.error('Error al cargar las intenciones:', error);
                        intentionsList.innerHTML = '<p class="text-red-500">Lo sentimos, no pudimos cargar las intenciones. Intenta de nuevo más tarde.</p>';
                    });
            } catch (error) {
                console.error('Error al cargar las intenciones:', error);
                intentionsList.innerHTML = '<p class="text-red-500">Lo sentimos, no pudimos cargar las intenciones. Intenta de nuevo más tarde.</p>';
            }
        }

        // Inicia el proceso de la aplicación
        document.addEventListener('DOMContentLoaded', () => {
            initializeFirebase();
            setupFormSubmission();
        });

        // Función para mostrar u ocultar el menú en dispositivos móviles
        function toggleMenu() {
            const menu = document.getElementById('menu');
            if (menu) {
                menu.classList.toggle('show');
            }
        }
    </script>
</body>
</html>
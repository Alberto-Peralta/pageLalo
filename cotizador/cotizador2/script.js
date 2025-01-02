// Variables globales
let map, marker, watchID, polyline; // Variables para el mapa, marcador, ID de seguimiento y línea trazada
let totalDistance = 0, totalTime = 0, seconds = 0, minutes = 0, quote = 0; // Distancia total, tiempo total y datos para calcular el costo
let previousPosition = null, path = [], timerInterval; // Posición previa, ruta y temporizador
let isCostIncreased = false; // Indica si el costo tiene un incremento

// Inicializa el mapa al cargar la página
function initMap() {
    if (navigator.geolocation) { // Verifica si la geolocalización está disponible
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => createMap({ lat: coords.latitude, lng: coords.longitude }), // Crea el mapa con la ubicación actual
            () => {
                const defaultLocation = { lat: -34.397, lng: 150.644 }; // Ubicación predeterminada
                createMap(defaultLocation);
                console.warn("Ubicación no disponible. Mostrando ubicación predeterminada.");
            }
        );
    } else {
        alert("Geolocalización no es compatible con este navegador."); // Alerta si el navegador no soporta geolocalización
    }
}

// Crea el mapa centrado en la ubicación proporcionada
function createMap(location) {
    map = new google.maps.Map(document.getElementById('map'), { center: location, zoom: 15 }); // Configuración del mapa
    marker = new google.maps.Marker({
        position: location, // Posición inicial del marcador
        map, // Asocia el marcador al mapa
        icon: { // Configuración del ícono
            url: '../../icons/car.png', // Ruta al ícono personalizado
            scaledSize: new google.maps.Size(40, 40), // Tamaño del ícono
            anchor: new google.maps.Point(20, 20), // Punto de anclaje
        }
    });
}

// Inicia el seguimiento de la posición
function startTracking() {
    console.log("Inicio del seguimiento.");
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;

    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError);
        startTimer();
        console.log("Cronómetro iniciado.");
    }
}

function updatePosition({ coords }) {
    const currentPosition = { lat: coords.latitude, lng: coords.longitude };

    // Si hay una posición anterior, calcula la distancia recorrida
    if (previousPosition) {
        const distance = calculateDistance(previousPosition, currentPosition);
        totalDistance += distance;
        path.push(currentPosition);
        drawPath();
    } else {
        // Inicializa la posición anterior si es la primera
        path.push(currentPosition);
    }

    previousPosition = currentPosition;

    // Actualiza la posición del marcador en el mapa
    marker.setPosition(currentPosition);

    // Actualiza los costos en tiempo real
    updateCost();
}

function startTimer() {
    console.log("Iniciando cronómetro...");
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        totalTime = minutes * 60 + seconds; // Actualiza el tiempo total

        // Actualiza el cronómetro visible
        document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Actualiza los costos en tiempo real
        updateCost();

        console.log(`Cronómetro: ${minutes}:${seconds}`);
    }, 1000);
}


// Detiene el seguimiento y muestra los resultados
function stopTracking() {
    toggleButtons(false); // Cambia el estado de los botones
    if (watchID) navigator.geolocation.clearWatch(watchID); // Detiene el seguimiento de posición
    if (timerInterval) clearInterval(timerInterval); // Detiene el cronómetro
    displayResults(); // Muestra los resultados
}

// Actualiza la distancia, tiempo y costo
function updateCost() {
    const distanceKm = (totalDistance / 1000).toFixed(2); // Convierte la distancia a kilómetros
    const timeMinutes = (totalTime / 60).toFixed(2); // Convierte el tiempo a minutos
    quote = calculateQuote(distanceKm, timeMinutes); // Calcula el costo

    document.getElementById('info').innerHTML = `
        <p><strong>Total Distance:</strong> ${distanceKm} km</p>
        <p><strong>Total Time:</strong> ${timeMinutes} minutes</p>
        <p><strong>Quote:</strong> $${quote}</p>
    `; // Actualiza la información en pantalla
}

// Calcula el costo basado en la distancia y tiempo
function calculateQuote(distance, time) {
    const base = 35; // Tarifa base
    const ratePerKm = 5.25; // Costo por kilómetro
    const ratePerMinute = 2; // Costo por minuto
    let cost = (distance * ratePerKm + time * ratePerMinute + base); // Fórmula del costo
    return (isCostIncreased ? cost * 1.25 : cost).toFixed(2); // Aplica un incremento si está activado
}

// Dibuja la ruta en el mapa
function drawPath() {
    if (!polyline) {
        polyline = new google.maps.Polyline({
            map,
            geodesic: true, // Define una línea geodésica
            strokeColor: '#FF0000', // Color de la línea
            strokeOpacity: 1.0, // Opacidad de la línea
            strokeWeight: 2 // Grosor de la línea
        });
    }
    polyline.setPath(path); // Establece la ruta en la línea
}

// Calcula la distancia entre dos puntos usando la fórmula de Haversine
function calculateDistance(prev, current) {
    const R = 6371e3; // Radio de la Tierra en metros
    const toRad = (deg) => deg * Math.PI / 180; // Convierte grados a radianes
    const [lat1, lat2] = [toRad(prev.lat), toRad(current.lat)];
    const deltaLat = toRad(current.lat - prev.lat);
    const deltaLng = toRad(current.lng - prev.lng);
    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // Calcula la distancia
}

// Inicia el cronómetro
function startTimer() {
    console.log("Iniciando cronómetro...");
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds >= 60) { // Incrementa los minutos si los segundos llegan a 60
            seconds = 0;
            minutes++;
        }

        // Actualiza el cronómetro en pantalla
        document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        console.log(`Cronómetro: ${minutes}:${seconds}`);
    }, 1000); // Intervalo de un segundo
}

// Muestra los resultados del viaje
function displayResults() {
    const distanceKm = (totalDistance / 1000).toFixed(2); // Convierte la distancia a kilómetros
    const timeMinutes = (totalTime / 60).toFixed(2); // Convierte el tiempo a minutos
    alert(`Viaje Finalizado! \n Distancia: ${distanceKm} km \n Tiempo: ${timeMinutes} minutos \n Costo Final: $${quote}`); // Muestra los resultados
}

// Maneja los errores de geolocalización
function handleError({ code, message }) {
    console.warn(`ERROR(${code}): ${message}`); // Muestra un mensaje de error
}

// Cambia el estado de los botones según el seguimiento
function toggleButtons(isTracking) {
    document.getElementById('startButton').disabled = isTracking;
    document.getElementById('stopButton').disabled = !isTracking;
}

// Añade un evento para aumentar o reducir el costo
document.getElementById('increaseCostButton').addEventListener('click', () => {
    isCostIncreased = !isCostIncreased; // Alterna el estado del incremento de costo
    document.getElementById('increaseCostButton').textContent =
        isCostIncreased ? 'Desactivar Aumento de Costo' : 'Aumentar Costo 25%'; // Cambia el texto del botón
    updateCost(); // Actualiza el costo
});

// Llama a la función de inicialización del mapa al cargar la ventana
window.onload = initMap;

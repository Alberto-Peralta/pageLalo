let map;
let marker;
let watchID;
let totalDistance = 0;
let totalTime = 0;
let previousPosition = null;
let path = [];
let polyline;
let timerInterval;
let isCostIncreased = false; // Controla si el costo está aumentado
let seconds = 0;
let minutes = 0;
let quote = 0; // Costo final

// Inicializa el mapa
function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            createMap(userLocation);
        }, function() {
            const defaultLocation = { lat: -34.397, lng: 150.644 };
            createMap(defaultLocation);
            console.warn("No se pudo obtener la ubicación del usuario. Mostrando ubicación predeterminada.");
        });
    } else {
        alert("Geolocalización no es compatible con este navegador.");
    }
}

// Crear el mapa
function createMap(location) {
    map = new google.maps.Map(document.getElementById('map'), { center: location, zoom: 15 });

    const carIcon = {
        url: '../../icons/car.png',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
        origin: new google.maps.Point(0, 0),
        rotation: 0
    };

    marker = new google.maps.Marker({
        position: location,
        map: map,
        icon: carIcon
    });
}

// Inicia el seguimiento de ubicación
function startTracking() {
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;

    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError);
        startTimer();
    }
}

// Detiene el seguimiento de ubicación
function stopTracking() {
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;

    navigator.geolocation.clearWatch(watchID);
    displayResults();
    clearInterval(timerInterval);
}

// Actualiza la posición del usuario
function updatePosition(position) {
    const currentPosition = { lat: position.coords.latitude, lng: position.coords.longitude };

    path.push(currentPosition);
    if (previousPosition) {
        const distance = calculateDistance(previousPosition, currentPosition);
        totalDistance += distance;
        totalTime += 1;
    }

    marker.setPosition(currentPosition);
    marker.setRotation(calculateHeading(previousPosition, currentPosition));
    map.setCenter(currentPosition);

    previousPosition = currentPosition;
    drawPath();
    updateCost();
}

// Dibuja el camino recorrido
function drawPath() {
    if (!polyline) {
        polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        polyline.setMap(map);
    } else {
        polyline.setPath(path);
    }
}

// Calcula la distancia entre dos puntos
function calculateDistance(prevPos, currentPos) {
    const R = 6371e3; // Radio de la Tierra en metros
    const lat1 = prevPos.lat * Math.PI / 180;
    const lat2 = currentPos.lat * Math.PI / 180;
    const deltaLat = (currentPos.lat - prevPos.lat) * Math.PI / 180;
    const deltaLng = (currentPos.lng - prevPos.lng) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Devuelve la distancia en metros
}

// Calcula el rumbo entre dos puntos
function calculateHeading(prevPos, currentPos) {
    const lat1 = prevPos.lat * Math.PI / 180;
    const lat2 = currentPos.lat * Math.PI / 180;
    const lng1 = prevPos.lng * Math.PI / 180;
    const lng2 = currentPos.lng * Math.PI / 180;

    const dLng = lng2 - lng1;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const heading = Math.atan2(y, x);

    return (heading * 180 / Math.PI);
}

// Actualiza el costo
function updateCost() {
    const distanceInKm = (totalDistance / 1000).toFixed(2);
    const timeInMinutes = (totalTime / 60).toFixed(2);
    quote = calculateQuote(distanceInKm, timeInMinutes);

    document.getElementById('info').innerHTML = `
        <p>Total Distance: ${distanceInKm} km</p>
        <p>Total Time: ${timeInMinutes} minutes</p>
        <p>Quote: $${quote}</p>
    `;
}

// Calcula el costo basado en la distancia y el tiempo
function calculateQuote(distance, time) {
    const ratePerKm = 5.25;
    const ratePerMinute = 2;
    const base = 35;

    let finalCost = (distance * ratePerKm + time * ratePerMinute + base).toFixed(2);

    if (isCostIncreased) {
        finalCost = (finalCost * 1.25).toFixed(2); // Aumentar el costo en un 25%
    }

    return finalCost;
}

// Inicia el cronómetro
function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }

        document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);
}

// Botón para aumentar el costo
document.getElementById('increaseCostButton').addEventListener('click', () => {
    isCostIncreased = !isCostIncreased;
    const buttonText = isCostIncreased ? 'Desactivar Aumento de Costo' : 'Aumentar Costo 25%';
    document.getElementById('increaseCostButton').textContent = buttonText;
    updateCost();
});

// Muestra los resultados finales al detener el viaje
function displayResults() {
    const distanceInKm = (totalDistance / 1000).toFixed(2);
    const timeInMinutes = (totalTime / 60).toFixed(2);
    const finalCost = calculateQuote(distanceInKm, timeInMinutes);

    alert(`Viaje Finalizado! \n Distancia: ${distanceInKm} km \n Tiempo: ${timeInMinutes} minutos \n Costo Final: $${finalCost}`);
}

// Manejo de errores de geolocalización
function handleError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
}

window.onload = initMap;

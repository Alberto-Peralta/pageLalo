let map;
let marker;
let watchID;
let startTime;
let distance = 0; // en metros
let timerInterval;

function initMap() {
    // Inicializa el mapa en una ubicación predeterminada (por ejemplo, Ciudad de México)
    const defaultLocation = { lat: 19.4326, lng: -99.1332 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: defaultLocation,
    });

    // Crea un marcador personalizado
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        title: "Tu ubicación",
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png" // Cambia la URL por la de tu marcador personalizado
        }
    });

    document.getElementById("startButton").onclick = startTrip;
    document.getElementById("stopButton").onclick = stopTrip;
}

function startTrip() {
    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError, {
            enableHighAccuracy: true,
        });
        startTime = Date.now();
        distance = 0;

        timerInterval = setInterval(updateTimer, 1000);
    } else {
        alert("La geolocalización no es compatible con este navegador.");
    }
}

function stopTrip() {
    if (watchID) {
        navigator.geolocation.clearWatch(watchID);
        clearInterval(timerInterval);
        alert(`Viaje finalizado. Distancia total: ${(distance / 1000).toFixed(2)} km. Tiempo total: ${getTimeElapsed()}`);
    }
}

function updatePosition(position) {
    const { latitude, longitude } = position.coords;

    // Actualiza la posición del marcador
    const newPosition = { lat: latitude, lng: longitude };
    marker.setPosition(newPosition);
    map.setCenter(newPosition);

    // Calcula la distancia recorrida
    if (marker.getPosition()) {
        const prevPosition = marker.getPosition();
        distance += google.maps.geometry.spherical.computeDistanceBetween(prevPosition, newPosition);
    }

    // Actualiza la distancia en la interfaz
    document.getElementById("distance").innerText = `Distancia: ${(distance / 1000).toFixed(2)} km (${distance.toFixed(1)} m)`;
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    document.getElementById("timer").innerText = `Tiempo: ${formatTime(elapsedTime)}`;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function getTimeElapsed() {
    const elapsedTime = Date.now() - startTime;
    return formatTime(elapsedTime);
}

function handleError(error) {
    console.error("Error al obtener la ubicación: ", error);
    alert("No se pudo obtener la ubicación. Asegúrate de que la geolocalización esté habilitada.");
}
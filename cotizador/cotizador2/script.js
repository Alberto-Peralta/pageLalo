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
        zoom: 50,
        center: defaultLocation,
    });

    // Crea un marcador personalizado
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        title: "Tu ubicación",
        icon: {
            url: "../../icons/car.png", // Usa una URL absoluta para probar
            scaledSize: new google.maps.Size(50, 50) // Ajusta el tamaño del icono si es necesario
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

        // Mostrar los datos en tiempo real
        document.getElementById("liveStats").style.display = "block";
    } else {
        alert("La geolocalización no es compatible con este navegador.");
    }
}


function stopTrip() {
    if (watchID) {
        navigator.geolocation.clearWatch(watchID);
        clearInterval(timerInterval);

        // Ocultar los datos en tiempo real
        document.getElementById("liveStats").style.display = "none";

        // Mostrar los detalles finales del viaje
        document.getElementById("finalDistance").innerText = `Distancia total: ${(distance / 1000).toFixed(2)} km.`;
        document.getElementById("finalTime").innerText = `Tiempo total: ${getTimeElapsed()}.`;
        document.getElementById("tripDetails").style.display = "block";
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

    // Actualiza la distancia en tiempo real
    document.getElementById("liveDistance").innerText = `Distancia: ${(distance / 1000).toFixed(2)} km`;
}


function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    document.getElementById("liveTime").innerText = `Tiempo: ${formatTime(elapsedTime)}`;
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
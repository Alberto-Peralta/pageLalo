let map;
let marker;
let watchId;
let startTime;
let distance = 0; // Distancia en metros
let timerInterval;

function initMap() {
    // Intentar obtener la ubicación actual del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                // Inicializar el mapa centrado en la ubicación actual
                map = new google.maps.Map(document.getElementById("map"), {
                    zoom: 15, // Nivel de zoom similar a Uber
                    center: userLocation,
                });

                // Crear el marcador en la ubicación actual
                marker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "Tu ubicación actual",
                    icon: {
                        url: "../../icons/car.png", // Cambia esto a la URL de tu marcador personalizado
                        scaledSize: new google.maps.Size(30, 30), // Tamaño del marcador
                    },
                });

                // Agregar listeners para botones
                document.getElementById("startButton").addEventListener("click", startTrip);
                document.getElementById("stopButton").addEventListener("click", stopTrip);
            },
            (error) => {
                console.warn(`ERROR(${error.code}): ${error.message}`);
                // Si no se puede obtener la ubicación, usar una ubicación por defecto
                const defaultLocation = { lat: -34.397, lng: 150.644 };
                initDefaultMap(defaultLocation);
            },
            {
                enableHighAccuracy: true,
            }
        );
    } else {
        alert("Geolocalización no soportada por este navegador.");
        // Usar una ubicación por defecto
        const defaultLocation = { lat: -34.397, lng: 150.644 };
        initDefaultMap(defaultLocation);
    }
}

function initDefaultMap(defaultLocation) {
    // Inicializar el mapa con una ubicación por defecto
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: defaultLocation,
    });

    // Crear un marcador en la ubicación por defecto
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        title: "Ubicación por defecto",
        icon: {
            url: "../../icons/car.png",
            scaledSize: new google.maps.Size(30, 30),
        },
    });

    // Agregar listeners para botones
    document.getElementById("startButton").addEventListener("click", startTrip);
    document.getElementById("stopButton").addEventListener("click", stopTrip);
}

function startTrip() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
            enableHighAccuracy: true,
        });
        startTime = Date.now();
        startTimer();
    } else {
        alert("Geolocalización no soportada por este navegador.");
    }
}

function stopTrip() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        clearInterval(timerInterval);
        showTripDetails();
    }
}

function updatePosition(position) {
    const newPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    if (marker.getPosition()) {
        const lastPos = marker.getPosition();
        const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(lastPos, newPos);
        distance += segmentDistance; // Sumar al total
    }

    // Actualizar la posición del marcador y centrar el mapa
    marker.setPosition(newPos);
    map.setCenter(newPos);
}

function handleError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
}

function startTimer() {
    const timerDisplay = document.getElementById("timer");
    const distanceDisplay = document.getElementById("distance"); // Elemento para mostrar la distancia
    let seconds = 0;

    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;

        // Actualizar el tiempo transcurrido
        timerDisplay.textContent = `${minutes}:${displaySeconds < 10 ? '0' : ''}${displaySeconds}`;

        // Actualizar la distancia recorrida
        const totalDistanceKm = (distance / 1000).toFixed(2); // Convertir a kilómetros con 2 decimales
        const totalDistanceMeters = distance.toFixed(1); // Distancia en metros con un decimal
        distanceDisplay.textContent = `Distancia: ${totalDistanceKm} km (${totalDistanceMeters} m)`;
    }, 1000);
}

function showTripDetails() {
    const infoDiv = document.getElementById("info");
    const totalDistanceKm = (distance / 1000).toFixed(2); // Convertir a kilómetros
    const totalTime = Math.floor((Date.now() - startTime) / 1000); // Tiempo total en segundos
    const totalMinutes = Math.floor(totalTime / 60);
    const totalSeconds = totalTime % 60;

    infoDiv.innerHTML = `Distancia recorrida: ${totalDistanceKm} km<br>Tiempo total: ${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;
}

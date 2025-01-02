let map;
let marker;
let watchID;
let totalDistance = 0;
let totalTime = 0;
let previousPosition = null;
let path = []; // Array para almacenar las posiciones
let polyline;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Inicializar el mapa centrado en la ubicación del usuario
            map = new google.maps.Map(document.getElementById('map'), {
                center: userLocation,
                zoom: 15
            });

            // Usar un ícono de coche para el marcador
            const carIcon = {
                url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Red_car_icon.svg', // URL del ícono
                scaledSize: new google.maps.Size(40, 40), // Tamaño ajustado del ícono
                anchor: new google.maps.Point(20, 20), // Centrar el ícono
                origin: new google.maps.Point(0, 0), // Origen del ícono
                rotation: 0 // Rotación inicial
            };

            // Colocar el marcador en la ubicación actual con el ícono de coche
            marker = new google.maps.Marker({
                position: userLocation,
                map: map,
                icon: carIcon // Establecer el ícono del marcador
            });

        }, function(error) {
            const defaultLocation = { lat: -34.397, lng: 150.644 };
            map = new google.maps.Map(document.getElementById('map'), {
                center: defaultLocation,
                zoom: 15
            });
            marker = new google.maps.Marker({
                position: defaultLocation,
                map: map
            });
            console.warn("No se pudo obtener la ubicación del usuario. Mostrando ubicación predeterminada.");
        });
    } else {
        alert("Geolocalización no es compatible con este navegador.");
    }
}

function startTracking() {
    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError);
    }
}

function stopTracking() {
    navigator.geolocation.clearWatch(watchID);
    displayResults();
}

function updatePosition(position) {
    const currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    // Agregar la posición actual al array de path
    path.push(currentPosition);

    if (previousPosition) {
        const distance = calculateDistance(previousPosition, currentPosition);
        totalDistance += distance;
        totalTime += 1; // Asumiendo intervalos de 1 segundo para simplicidad
    }

    // Actualizar la posición del marcador
    marker.setPosition(currentPosition);

    // Girar el marcador para que apunte en la dirección del movimiento
    const heading = calculateHeading(previousPosition, currentPosition);
    marker.setRotation(heading); // Rotar el marcador según la dirección

    // Centrar el mapa en la nueva posición
    map.setCenter(currentPosition);

    previousPosition = currentPosition;

    drawPath(); // Llamar a la función para dibujar la línea
}

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
        polyline.setPath(path); // Actualiza el path de la polilínea
    }
}

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
    return R * c; // Distancia en metros
}

function calculateHeading(prevPos, currentPos) {
    const lat1 = prevPos.lat * Math.PI / 180;
    const lat2 = currentPos.lat * Math.PI / 180;
    const lng1 = prevPos.lng * Math.PI / 180;
    const lng2 = currentPos.lng * Math.PI / 180;

    const dLng = lng2 - lng1;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const heading = Math.atan2(y, x);

    return (heading * 180 / Math.PI); // Convertir radianes a grados
}

function displayResults() {
    const distanceInKm = (totalDistance / 1000).toFixed(2);
    const timeInMinutes = (totalTime / 60).toFixed(2);
    const quote = calculateQuote(distanceInKm, timeInMinutes);
    document.getElementById('info').innerHTML = `
        <p>Total Distance: ${distanceInKm} km</p>
        <p>Total Time: ${timeInMinutes} minutes</p>
        <p>Quote: $${quote}</p>
    `;
}

function calculateQuote(distance, time) {
    const ratePerKm = 2; // Tarifa por km
    const ratePerMinute = 0.5; // Tarifa por minuto
    return (distance * ratePerKm + time * ratePerMinute).toFixed(2);
}

function handleError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
}

// Inicializar el mapa cuando la ventana se carga
window.onload = initMap;

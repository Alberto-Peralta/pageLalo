let map;
let marker;
let watchID;
let totalDistance = 0;
let totalTime = 0;
let previousPosition = null;
let path = [];
let polyline;
let timerInterval;
let isCostIncreased = false; // Controlar si el costo ha aumentado

// Variables para el cronómetro
let seconds = 0;
let minutes = 0;

// Inicializar el mapa
function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map = new google.maps.Map(document.getElementById('map'), {
                center: userLocation,
                zoom: 15
            });

            const carIcon = {
                url: '../../icons/car.png',
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
                origin: new google.maps.Point(0, 0),
                rotation: 0
            };

            marker = new google.maps.Marker({
                position: userLocation,
                map: map,
                icon: carIcon
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
        startTimer(); // Iniciar el cronómetro
    }
}

function stopTracking() {
    navigator.geolocation.clearWatch(watchID);
    displayResults();
    clearInterval(timerInterval); // Detener el cronómetro
}

function updatePosition(position) {
    const currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    path.push(currentPosition);

    if (previousPosition) {
        const distance = calculateDistance(previousPosition, currentPosition);
        totalDistance += distance;
        totalTime += 1;
    }

    marker.setPosition(currentPosition);
    const heading = calculateHeading(previousPosition, currentPosition);
    marker.setRotation(heading);
    map.setCenter(currentPosition);

    previousPosition = currentPosition;
    drawPath();
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
        polyline.setPath(path);
    }
}

function calculateDistance(prevPos, currentPos) {
    const R = 6371e3;
    const lat1 = prevPos.lat * Math.PI / 180;
    const lat2 = currentPos.lat * Math.PI / 180;
    const deltaLat = (currentPos.lat - prevPos.lat) * Math.PI / 180;
    const deltaLng = (currentPos.lng - prevPos.lng) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
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

    return (heading * 180 / Math.PI);
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
    const ratePerKm = 5.25;
    const ratePerMinute = 2;
    const base = 35;

    let finalCost = (distance * ratePerKm + time * ratePerMinute + base).toFixed(2);

    if (isCostIncreased) {
        finalCost = (finalCost * 1.25).toFixed(2); // Aumentar el costo en un 25%
    }

    return finalCost;
}

// Cronómetro
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
});

function handleError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
}

window.onload = initMap;

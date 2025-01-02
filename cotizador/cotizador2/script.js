let map, marker, watchID, polyline;
let totalDistance = 0, totalTime = 0, seconds = 0, minutes = 0, quote = 0;
let previousPosition = null, path = [], timerInterval;
let isCostIncreased = false;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => createMap({ lat: coords.latitude, lng: coords.longitude }),
            () => {
                const defaultLocation = { lat: -34.397, lng: 150.644 };
                createMap(defaultLocation);
                console.warn("Ubicación no disponible. Mostrando ubicación predeterminada.");
            }
        );
    } else {
        alert("Geolocalización no es compatible con este navegador.");
    }
}

function createMap(location) {
    map = new google.maps.Map(document.getElementById('map'), { center: location, zoom: 15 });
    marker = new google.maps.Marker({
        position: location,
        map,
        icon: {
            url: '../../icons/car.png',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
        }
    });
}

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


function stopTracking() {
    toggleButtons(false);
    navigator.geolocation.clearWatch(watchID);
    clearInterval(timerInterval);
    displayResults();
}

function updatePosition({ coords }) {
    const currentPosition = { lat: coords.latitude, lng: coords.longitude };
    path.push(currentPosition);

    if (previousPosition) {
        totalDistance += calculateDistance(previousPosition, currentPosition);
        totalTime++;
    }

    marker.setPosition(currentPosition);
    map.setCenter(currentPosition);
    drawPath();
    updateCost();

    previousPosition = currentPosition;
}

function drawPath() {
    if (!polyline) {
        polyline = new google.maps.Polyline({
            map,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    }
    polyline.setPath(path);
}

function calculateDistance(prev, current) {
    const R = 6371e3; // Earth's radius in meters
    const toRad = (deg) => deg * Math.PI / 180;
    const [lat1, lat2] = [toRad(prev.lat), toRad(current.lat)];
    const deltaLat = toRad(current.lat - prev.lat);
    const deltaLng = toRad(current.lng - prev.lng);
    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updateCost() {
    const distanceKm = (totalDistance / 1000).toFixed(2);
    const timeMinutes = (totalTime / 60).toFixed(2);
    quote = calculateQuote(distanceKm, timeMinutes);

    document.getElementById('info').innerHTML = `
        <p>Total Distance: ${distanceKm} km</p>
        <p>Total Time: ${timeMinutes} minutes</p>
        <p>Quote: $${quote}</p>
    `;
}

function calculateQuote(distance, time) {
    const base = 35, ratePerKm = 5.25, ratePerMinute = 2;
    let cost = (distance * ratePerKm + time * ratePerMinute + base).toFixed(2);
    return isCostIncreased ? (cost * 1.25).toFixed(2) : cost;
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (++seconds === 60) {
            seconds = 0;
            minutes++;
        }
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function displayResults() {
    const distanceKm = (totalDistance / 1000).toFixed(2);
    const timeMinutes = (totalTime / 60).toFixed(2);
    alert(`Viaje Finalizado! \n Distancia: ${distanceKm} km \n Tiempo: ${timeMinutes} minutos \n Costo Final: $${quote}`);
}

function handleError({ code, message }) {
    console.warn(`ERROR(${code}): ${message}`);
}

function toggleButtons(isTracking) {
    document.getElementById('startButton').disabled = isTracking;
    document.getElementById('stopButton').disabled = !isTracking;
}

document.getElementById('increaseCostButton').addEventListener('click', () => {
    isCostIncreased = !isCostIncreased;
    document.getElementById('increaseCostButton').textContent =
        isCostIncreased ? 'Desactivar Aumento de Costo' : 'Aumentar Costo 25%';
    updateCost();
});

window.onload = initMap;

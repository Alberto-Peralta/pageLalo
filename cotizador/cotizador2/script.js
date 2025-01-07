let map;
let marker;
let startCoords;
let watchId;
let distanceTravelled = 0;
let startTime;
let timerInterval;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            startCoords = { lat: latitude, lng: longitude };
            map = new google.maps.Map(document.getElementById('map'), {
                center: startCoords,
                zoom: 30
            });
            marker = new google.maps.Marker({
                position: startCoords,
                map: map,
                icon: {
                    url: '../../icons/car.png',
                    scaledSize: new google.maps.Size(50, 50), // Tamaño del icono
                    anchor: new google.maps.Point(25, 25) // Punto de anclaje
                }
            });
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}


function startTrip() {
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    startTime = new Date();
    timerInterval = setInterval(updateTime, 1000);
    watchId = navigator.geolocation.watchPosition(trackLocation);
}

function stopTrip() {
    clearInterval(timerInterval);
    navigator.geolocation.clearWatch(watchId);
    showSummary();
}

function trackLocation(position) {
    const { latitude, longitude } = position.coords;
    const newCoords = { lat: latitude, lng: longitude };
    const distance = calculateDistance(startCoords, newCoords);
    distanceTravelled += distance;
    startCoords = newCoords;

    marker.setPosition(newCoords);
    map.panTo(newCoords);

    document.getElementById('distance').innerText = `${(distanceTravelled / 1000).toFixed(2)} km`;
}

function calculateDistance(coords1, coords2) {
    const R = 6371e3; // metres
    const φ1 = coords1.lat * Math.PI / 180;
    const φ2 = coords2.lat * Math.PI / 180;
    const Δφ = (coords2.lat - coords1.lat) * Math.PI / 180;
    const Δλ = (coords2.lng - coords1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function updateTime() {
    const currentTime = new Date();
    const elapsedTime = new Date(currentTime - startTime);
    const minutes = elapsedTime.getUTCMinutes();
    const seconds = elapsedTime.getUTCSeconds();
    document.getElementById('time').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}


function updateTimeAndDistance() {
    const currentPosition = { lat: currentCoords.lat, lng: currentCoords.lng };
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(currentCoords.lat, currentCoords.lng),
        new google.maps.LatLng(map.getCenter().lat(), map.getCenter().lng())
    );
    distanceTravelled += distance;

    const distanceKm = (distanceTravelled / 1000).toFixed(2);
    document.getElementById('distance').innerText = `${distanceKm} km`;

    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    document.getElementById('time').innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Calcular el costo en tiempo real
    const costPerKm = 5.25;
    const costPerMinute = 2.00;
    const totalCost = (distanceKm * costPerKm) + (minutes * costPerMinute);
    document.getElementById('realTimeCost').innerText = `Cost: $${totalCost.toFixed(2)}`;

    // Actualizar la posición del marcador
    currentCoords = currentPosition;
    marker.setPosition(currentPosition);
    map.setCenter(currentPosition);
}


function showSummary() {
    const distanceKm = (distanceTravelled / 1000).toFixed(2);
    const timeElapsed = document.getElementById('time').innerText;
    const timeParts = timeElapsed.split(':');
    const minutesElapsed = parseInt(timeParts[0], 10) + parseInt(timeParts[1], 10) / 60;
    
    const costPerKm = 5.25;
    const costPerMinute = 2.00;
    const totalCost = (distanceKm * costPerKm) + (minutesElapsed * costPerMinute);

    const summaryDiv = document.getElementById('summary');
    
    summaryDiv.innerHTML = `
        <h3>Trip Summary</h3>
        <p><strong>Distance:</strong> ${distanceKm} km</p>
        <p><strong>Time:</strong> ${timeElapsed}</p>
        <p><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</p>
    `;
    
    summaryDiv.classList.remove('hidden');
    document.querySelector('.controls').classList.add('hidden');
}




document.getElementById('startBtn').addEventListener('click', startTrip);
document.getElementById('stopBtn').addEventListener('click', stopTrip);

window.onload = initMap;

let map;
let marker;
let watchId;
let startTime;
let distanceCovered = 0;
let totalTime = 0;
let costMultiplier = 1.0;

document.getElementById('startBtn').addEventListener('click', startJourney);
document.getElementById('endBtn').addEventListener('click', endJourney);
document.getElementById('costAdjustBtn').addEventListener('click', adjustCost);

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 15,
    });
    marker = new google.maps.Marker({
        position: { lat: 0, lng: 0 },
        map: map,
    });
}

function startJourney() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(updatePosition, handleError);
        startTime = Date.now();
        document.getElementById('startBtn').disabled = true;
        document.getElementById('endBtn').disabled = false;
        updateTime();
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function updatePosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const currentPosition = new google.maps.LatLng(lat, lng);
    
    if (marker) {
        marker.setPosition(currentPosition);
        map.setCenter(currentPosition);
    }

    // Calculate distance
    if (marker.getPosition().lat() !== 0 && marker.getPosition().lng() !== 0) {
        const prevPosition = marker.getPosition();
        const distance = google.maps.geometry.spherical.computeDistanceBetween(prevPosition, currentPosition);
        distanceCovered += distance;
    }
    
    // Update distance in km
    document.getElementById('distance').innerText = `Distancia: ${(distanceCovered / 1000).toFixed(2)} km`;
}

function updateTime() {
    totalTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    document.getElementById('time').innerText = `Tiempo: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    setTimeout(updateTime, 1000);
}

function endJourney() {
    navigator.geolocation.clearWatch(watchId);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('endBtn').disabled = true;

    const totalDistanceKm = (distanceCovered / 1000).toFixed(2);
    const totalMinutes = Math.floor(totalTime / 60);
    const totalSeconds = totalTime % 60;
    const cost = (totalDistanceKm * 5.25 + totalMinutes * 2.00) * costMultiplier;

    document.getElementById('summary').innerHTML = `
        <h3>Resumen del Viaje</h3>
        <p>Distancia Total: ${totalDistanceKm} km</p>
        <p>Tiempo Total: ${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}</p>
        <p>Costo Total: $${cost.toFixed(2)}</p>
    `;
    document.getElementById('summary').style.display = 'block';
}

function adjustCost() {
    costMultiplier = 1.25;
    document.getElementById('costAdjustBtn').style.backgroundColor = 'red';
}

// Initialize the map when the window loads
window.onload = initMap;
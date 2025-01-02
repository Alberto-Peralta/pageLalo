let map;
let marker;
let polyline;
let isTracking = false;
let path = [];
let stopTimes = [];
let lastStopTime = null;
let totalDistance = 0;
let totalTime = 0;
const pricePerKm = 1; // Set your price per kilometer
const pricePerMinute = 0.5; // Set your price per minute
const stopThreshold = 3 * 60 * 1000; // 3 minutes in milliseconds

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 15,
    });

    polyline = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });
    polyline.setMap(map);
}

function startTracking() {
    if (isTracking) return;

    isTracking = true;
    path = [];
    stopTimes = [];
    totalDistance = 0;
    totalTime = 0;
    lastStopTime = null;

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(position => {
            const currentPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            path.push(currentPos);
            polyline.setPath(path);
            map.setCenter(currentPos);

            // Calculate distance
            if (path.length > 1) {
                const prevPos = path[path.length - 2];
                totalDistance += google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(prevPos.lat, prevPos.lng),
                    new google.maps.LatLng(currentPos.lat, currentPos.lng)
                );
            }

            // Check for stops
            if (lastStopTime) {
                const stopDuration = new Date() - lastStopTime;
                if (stopDuration >= stopThreshold) {
                    stopTimes.push(stopDuration);
                    lastStopTime = null;
                }
            } else {
                lastStopTime = new Date();
            }
        });
    }
}

function stopTracking() {
    if (!isTracking) return;

    isTracking = false;

    // Calculate total time
    totalTime = (new Date() - lastStopTime) / 1000 / 60; // in minutes

    // Calculate costs
    const distanceCost = (totalDistance / 1000) * pricePerKm; // in km
    const timeCost = totalTime * pricePerMinute; // in minutes
    const stopCost = stopTimes.filter(t => t >= stopThreshold).length * 2; // $2 for each stop over 3 minutes

    // Display results
    const details = `
        <h3>Route Details</h3>
        <p>Total Distance: ${(totalDistance / 1000).toFixed(2)} km</p>
        <p>Total Time: ${totalTime.toFixed(2)} minutes</p>
        <p>Total Stops: ${stopTimes.length}</p>
        <p>Total Cost: $${(distanceCost + timeCost + stopCost).toFixed(2)}</p>
    `;
    document.getElementById("routeDetails").innerHTML = details;
}

document.getElementById("startTracking").addEventListener("click", startTracking);
document.getElementById("stopTracking").addEventListener("click", stopTracking);

window.onload = initMap;
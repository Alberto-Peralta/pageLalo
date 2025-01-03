let map, marker, path, polyline;
let watchID = null;
let startTime = null;
let timerInterval = null;
let distanceTravelled = 0;
const markerIcon = {
  url: 'https://example.com/car-icon.png', // Cambia esta URL por la de tu icono de auto.
  scaledSize: new google.maps.Size(50, 50), // Tamaño del icono.
};

function initMap() {
  const mapOptions = {
    zoom: 15,
    mapTypeId: 'roadmap',
  };

  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  polyline = new google.maps.Polyline({
    map: map,
    path: [],
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = new google.maps.LatLng(latitude, longitude);

        map.setCenter(currentLocation);
        marker = new google.maps.Marker({
          position: currentLocation,
          map: map,
          icon: markerIcon,
        });

        path = polyline.getPath();
        path.push(currentLocation);
      },
      () => alert('No se pudo obtener tu ubicación.'),
      { enableHighAccuracy: true }
    );
  } else {
    alert('Geolocalización no soportada en este navegador.');
  }

  document.getElementById('startButton').addEventListener('click', startTracking);
  document.getElementById('stopButton').addEventListener('click', stopTracking);
}

function startTracking() {
  if (navigator.geolocation && !watchID) {
    startTime = Date.now();
    updateTimer();

    watchID = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = new google.maps.LatLng(latitude, longitude);

        marker.setPosition(newPosition);
        path.push(newPosition);
        map.setCenter(newPosition);

        if (path.getLength() > 1) {
          const previousPosition = path.getAt(path.getLength() - 2);
          const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(
            previousPosition,
            newPosition
          );
          distanceTravelled += segmentDistance;
        }
      },
      () => alert('Error obteniendo ubicación en tiempo real.'),
      { enableHighAccuracy: true }
    );
  }
}

function stopTracking() {
  if (watchID) {
    navigator.geolocation.clearWatch(watchID);
    watchID = null;

    clearInterval(timerInterval);
    const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1); // Segundos
    const distanceInKm = (distanceTravelled / 1000).toFixed(2); // Kilómetros

    document.getElementById('info').innerHTML = `
      <p>Distancia recorrida: ${distanceInKm} km</p>
      <p>Tiempo transcurrido: ${formatTime(timeElapsed)}</p>
    `;
  }
}

function updateTimer() {
  const timerElement = document.getElementById('timer');
  timerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    timerElement.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

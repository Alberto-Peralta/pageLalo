let map, directionsService, directionsRenderer, watchId;
const destination = { lat: 19.432608, lng: -99.133209 }; // Cambiar por tu destino
const pricePerKm = 5; // Precio por kilómetro

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: destination,
        zoom: 14,
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });
    new google.maps.Marker({
        position: destination,
        map,
        title: "Destino",
    });
}

function trackRoute() {
    if (!navigator.geolocation) {
        return alert("Geolocalización no soportada en este navegador");
    }

    watchId = navigator.geolocation.watchPosition(
        ({ coords }) => {
            const origin = { lat: coords.latitude, lng: coords.longitude };
            calculateRoute(origin);
        },
        error => console.error("Error al obtener la posición", error),
        { enableHighAccuracy: true }
    );
}

function calculateRoute(origin) {
    directionsService.route(
        {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                updateDetails(result);
            } else {
                console.error("Error al calcular la ruta", status);
            }
        }
    );
}

function updateDetails(result) {
    const { distance, duration } = result.routes[0].legs[0];
    const distanceKm = distance.value / 1000; // Convertir a kilómetros
    const timeMinutes = duration.value / 60; // Convertir a minutos
    const stops = result.routes[0].legs[0].steps.filter(step => step.maneuver === "pause").length;
    const quote = (distanceKm * pricePerKm).toFixed(2);

    document.getElementById("details").innerHTML = `
        Distancia: ${distanceKm.toFixed(2)} km<br>
        Tiempo estimado: ${timeMinutes.toFixed(2)} minutos<br>
        Puntos de espera: ${stops} 
    `;
    document.getElementById("quote").innerHTML = `Cotización: $${quote}`;
}

document.getElementById("start-tracking").addEventListener("click", trackRoute);
window.initMap = initMap;
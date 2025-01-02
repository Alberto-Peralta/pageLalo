let map, directionsService, directionsRenderer, watchId;
const destination = { lat: 19.432608, lng: -99.133209 }; // Cambiar por tu destino
const pricePerKm = 5; // Precio por kilómetro (ajusta según sea necesario)

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: destination,
        zoom: 14,
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    const marker = new google.maps.Marker({
        position: destination,
        map,
        title: "Destino",
    });
}

function trackRoute() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            position => {
                const origin = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                directionsService.route(
                    {
                        origin,
                        destination,
                        travelMode: google.maps.TravelMode.DRIVING,
                    },
                    (result, status) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            directionsRenderer.setDirections(result);
                            calculateDetails(result);
                        } else {
                            console.error("Error al calcular la ruta", status);
                        }
                    }
                );
            },
            error => {
                console.error("Error al obtener la posición", error);
            },
            { enableHighAccuracy: true }
        );
    } else {
        alert("Geolocalización no soportada en este navegador");
    }
}

function calculateDetails(result) {
    const route = result.routes[0].legs[0];
    const distanceKm = route.distance.value / 1000; // Convertir a kilómetros
    const timeMinutes = route.duration.value / 60; // Convertir a minutos
    const stops = route.steps.filter(step => step.maneuver === "pause").length;
    const quote = (distanceKm * pricePerKm).toFixed(2);

    document.getElementById("details").innerHTML = `
        Distancia: ${distanceKm.toFixed(2)} km<br>
        Tiempo estimado: ${timeMinutes.toFixed(2)} minutos<br>
        Puntos de espera: ${stops} 
    `;
    document.getElementById("quote").innerHTML = `Cotización: $${quote}`;
}

document.getElementById("start-tracking").addEventListener("click", trackRoute);

// Inicializar el mapa
window.initMap = initMap;

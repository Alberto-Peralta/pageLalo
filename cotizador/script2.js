let map, directionsService, directionsRenderer, marker;
let travelPath = [];
let travelDistance = 0;
let travelDuration = 0;

// Inicializa el mapa y los servicios de Google Maps
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 19.432608, lng: -99.133209 }, // Ciudad de México como referencia
        zoom: 14,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    // Autocompletar para los campos de origen y destino
    const autocompleteOrigen = new google.maps.places.Autocomplete(document.getElementById("origen"));
    const autocompleteDestino = new google.maps.places.Autocomplete(document.getElementById("destino"));
}

// Función para iniciar el viaje
function iniciarViaje() {
    const origen = document.getElementById("origen").value;
    const destino = document.getElementById("destino").value;

    if (!origen || !destino) {
        alert("Por favor, ingresa origen y destino.");
        return;
    }

    const request = {
        origin: origen,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            const route = result.routes[0].legs[0];
            travelDistance = route.distance.value / 1000; // Convertir metros a kilómetros
            travelDuration = route.duration.value / 60; // Convertir segundos a minutos
            travelPath = route.steps.map((step) => ({
                lat: step.start_location.lat(),
                lng: step.start_location.lng(),
            }));
            travelPath.push({
                lat: route.end_location.lat(),
                lng: route.end_location.lng(),
            });

            // Colocar el marcador en el inicio
            if (!marker) {
                marker = new google.maps.Marker({
                    map,
                    icon: "https://maps.google.com/mapfiles/kml/shapes/cabs.png",
                });
            }
            marker.setPosition(travelPath[0]);
            seguirRuta();
            document.getElementById("finalizar-viaje").disabled = false;
            document.getElementById("iniciar-viaje").disabled = true;
        } else {
            alert("No se pudo calcular la ruta. Intenta con diferentes ubicaciones.");
        }
    });
}

// Simula el seguimiento de la ruta en tiempo real
function seguirRuta() {
    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex < travelPath.length) {
            marker.setPosition(travelPath[stepIndex]);
            map.panTo(travelPath[stepIndex]);
            stepIndex++;
        } else {
            clearInterval(interval);
        }
    }, 1000); // Actualización cada segundo
}

// Función para finalizar el viaje
function finalizarViaje() {
    const costoBase = {
        economico: 10,
        estandar: 15,
        premium: 20,
    };
    const servicio = document.getElementById("servicio").value;
    const costoFinal = (costoBase[servicio] + travelDistance * 2).toFixed(2); // Ejemplo de cálculo simple

    document.getElementById("detalle-costos").innerHTML = `
        <strong>Resumen del Viaje:</strong><br>
        Distancia: ${travelDistance.toFixed(2)} km<br>
        Tiempo: ${travelDuration.toFixed(2)} minutos<br>
        Costo: $${costoFinal} MXN
    `;

    document.getElementById("finalizar-viaje").disabled = true;
    document.getElementById("iniciar-viaje").disabled = false;
}

// Asigna los eventos a los botones
document.getElementById("iniciar-viaje").addEventListener("click", iniciarViaje);
document.getElementById("finalizar-viaje").addEventListener("click", finalizarViaje);

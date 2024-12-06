// script2.js

let map, directionsService, directionsRenderer, routePolyline, currentPath, originMarker, carMarker;
let startLocation = null;
let intervalId = null;
let travelDistance = 0; // Total distance in meters

const COSTS = {
    economico: 5,
    estandar: 10,
    premium: 20,
};

/**
 * Inicializa el mapa y servicios de Google Maps.
 */
function initMap() {
    // Crear el mapa centrado en una ubicación inicial
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 19.432608, lng: -99.133209 }, // Centro en Ciudad de México (valor por defecto)
        zoom: 14,
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    // Autocompletar en los inputs de origen y destino
    const originInput = document.getElementById("origen");
    const destinationInput = document.getElementById("destino");
    const autocompleteOrigin = new google.maps.places.Autocomplete(originInput);
    const autocompleteDestination = new google.maps.places.Autocomplete(destinationInput);

    // Obtener la ubicación actual
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const currentLocation = { lat: latitude, lng: longitude };
                
                // Centrar el mapa en la ubicación actual
                map.setCenter(currentLocation);

                // Crear un marcador en la ubicación actual
                originMarker = new google.maps.Marker({
                    position: currentLocation,
                    map,
                    icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                });
            },
            (error) => {
                console.error("Error obteniendo la ubicación: ", error);
                alert("No se pudo obtener la ubicación actual.");
            }
        );
    } else {
        alert("Geolocalización no soportada por tu navegador.");
    }

    setupEventListeners();
}

/**
 * Configura los listeners de los botones y lógica de viaje.
 */
function setupEventListeners() {
    const startButton = document.getElementById("iniciar-viaje");
    const endButton = document.getElementById("finalizar-viaje");

    startButton.addEventListener("click", () => {
        startButton.disabled = true;
        endButton.disabled = false;
        startTrip();
    });

    endButton.addEventListener("click", () => {
        endButton.disabled = true;
        startButton.disabled = false;
        endTrip();
    });
}

/**
 * Inicia el seguimiento del viaje desde la ubicación actual.
 */
function startTrip() {
    if (!navigator.geolocation) {
        alert("Geolocalización no soportada por tu navegador.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            startLocation = { lat: latitude, lng: longitude };

            // Marcador inicial
            originMarker = new google.maps.Marker({
                position: startLocation,
                map,
                icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            });

            currentPath = [startLocation];
            routePolyline = new google.maps.Polyline({
                path: currentPath,
                geodesic: true,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map,
            });

            carMarker = new google.maps.Marker({
                position: startLocation,
                map,
                icon: "https://maps.google.com/mapfiles/kml/shapes/cabs.png",
            });

            map.setCenter(startLocation);

            // Actualizar posición en tiempo real
            intervalId = setInterval(trackPosition, 3000); // Actualizar cada 3 segundos
        },
        (error) => {
            alert("Error obteniendo la ubicación: " + error.message);
        }
    );
}

/**
 * Rastrear posición en tiempo real y actualizar la ruta.
 */
function trackPosition() {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const currentPosition = { lat: latitude, lng: longitude };

            // Calcular distancia desde la última posición
            const lastPosition = currentPath[currentPath.length - 1];
            const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(lastPosition),
                new google.maps.LatLng(currentPosition)
            );

            travelDistance += segmentDistance;
            currentPath.push(currentPosition);

            // Actualizar línea de ruta
            routePolyline.setPath(currentPath);

            // Mover marcador del auto
            carMarker.setPosition(currentPosition);
        },
        (error) => {
            console.error("Error obteniendo la ubicación: ", error);
        }
    );
}

/**
 * Finaliza el viaje y calcula los costos.
 */
function endTrip() {
    clearInterval(intervalId);

    if (!startLocation || currentPath.length === 0) {
        alert("No se pudo calcular el viaje.");
        return;
    }

    const endLocation = currentPath[currentPath.length - 1];

    // Dibujar la ruta final entre origen y destino
    directionsService.route(
        {
            origin: startLocation,
            destination: endLocation,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);

                // Calcular distancia y tiempo final
                const route = result.routes[0];
                const totalDistance = route.legs[0].distance.value; // En metros
                const totalTime = route.legs[0].duration.value; // En segundos

                // Calcular costo final
                const serviceType = document.getElementById("servicio").value;
                const costPerKm = COSTS[serviceType];
                const totalCost = ((totalDistance / 1000) * costPerKm).toFixed(2);

                // Mostrar detalles
                document.getElementById("detalle-costos").innerHTML = `
                    Distancia: ${(totalDistance / 1000).toFixed(2)} km<br>
                    Tiempo: ${(totalTime / 60).toFixed(2)} minutos<br>
                    Costo: $${totalCost} MXN
                `;
            } else {
                console.error("Error obteniendo la ruta: ", status);
            }
        }
    );
}

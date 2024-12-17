let map;
let origenMarker;
let destinoMarker;
let directionsService;
let directionsRenderer;
let userLocation;

function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        alert("No se encontró el contenedor del mapa.");
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                map = new google.maps.Map(mapElement, {
                    center: userLocation,
                    zoom: 14,
                    gestureHandling: "cooperative",
                    mapTypeControlOptions: {
                        mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain"],
                    },
                });

                // Crear iconos personalizados
                const origenIcon = {
                    url: '../icons/android-chrome-192x192.png', // Reemplaza con la ruta a tu imagen de origen
                    scaledSize: new google.maps.Size(40, 40), // Ajusta el tamaño según sea necesario
                };
                const destinoIcon = {
                    url: 'ruta/a/tu/icono/destino.png', // Reemplaza con la ruta a tu imagen de destino
                    scaledSize: new google.maps.Size(40, 40), // Ajusta el tamaño según sea necesario
                };

                // Crear los marcadores
                origenMarker = new google.maps.Marker({
                    position: userLocation,
                    map,
                    draggable: true,
                    icon: origenIcon,
                    title: "Origen (arrástrame)",
                });

                destinoMarker = new google.maps.Marker({
                    position: {
                        lat: userLocation.lat + 0.01,
                        lng: userLocation.lng + 0.01,
                    },
                    map,
                    draggable: true,
                    icon: destinoIcon,
                    title: "Destino (arrástrame)",
                });

                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({ map });

                const updateRouteAndCenter = () => {
                    calculateRoute();
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(origenMarker.getPosition());
                    bounds.extend(destinoMarker.getPosition());
                    map.fitBounds(bounds);
                    updateFormFields();
                };

                origenMarker.addListener("dragend", updateRouteAndCenter);
                destinoMarker.addListener("dragend", updateRouteAndCenter);

                // Inicializar Autocompletado para los campos de origen y destino
                const originInput = document.getElementById("origen");
                const destinationInput = document.getElementById("destino");
                const autocompleteOrigen = new google.maps.places.Autocomplete(originInput);
                const autocompleteDestino = new google.maps.places.Autocomplete(destinationInput);

                autocompleteOrigen.addListener("place_changed", () => {
                    const place = autocompleteOrigen.getPlace();
                    if (place.geometry) {
                        origenMarker.setPosition(place.geometry.location);
                        map.setCenter(place.geometry.location);
                        updateRouteAndCenter();
                    }
                });

                autocompleteDestino.addListener("place_changed", () => {
                    const place = autocompleteDestino.getPlace();
                    if (place.geometry) {
                        destinoMarker.setPosition(place.geometry.location);
                        map.setCenter(place.geometry.location);
                        updateRouteAndCenter();
                    }
                });

                // Inicializar la ruta por defecto
                updateRouteAndCenter();
            },
            () => {
                alert("No se pudo obtener tu ubicación.");
            }
        );
    } else {
        alert("La geolocalización no es soportada por tu navegador.");
    }
}

function calculateRoute() {
    const origin = origenMarker.getPosition();
    const destination = destinoMarker.getPosition();
    if (!origin || !destination) {
        alert("Por favor arrastra los marcadores al origen y destino.");
        return;
    }
    directionsService.route(
        {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                const route = response.routes[0];
                const routeLeg = route.legs[0];
                const distance = routeLeg.distance.value / 1000; // Convertir a km
                const duration = routeLeg.duration.value / 60; // Convertir a minutos
                const baseFare = 35;
                const costPerKm = 7;
                const costPerMinute = 3;
                const estimate = baseFare + distance * costPerKm + duration * costPerMinute;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat()},${origin.lng()}&destination=${destination.lat()},${destination.lng()}`;
                document.getElementById("detalle-costos").innerHTML = `
                    <p>Tipo de servicio: Estándar</p>
                    <p>Distancia: ${distance.toFixed(2)} km</p>
                    <p>Tiempo estimado: ${duration.toFixed(0)} minutos</p>
                    <p>Costo estimado: $${estimate.toFixed(2)}</p>
                    <p><a href="${googleMapsUrl}" target="_blank" class="enlace-mapa">Ver en Google Maps</a></p>
                `;
            } else {
                alert("No se pudo calcular la ruta. Intenta nuevamente.");
            }
        }
    );
}

function updateFormFields() {
    const originInput = document.getElementById("origen");
    const destinationInput = document.getElementById("destino");
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: origenMarker.getPosition() }, (results, status) => {
        if (status === "OK" && results[0]) {
            originInput.value = results[0].formatted_address;
        }
    });

    geocoder.geocode({ location: destinoMarker.getPosition() }, (results, status) => {
        if (status === "OK" && results[0]) {
            destinationInput.value = results[0].formatted_address;
        }
    });
}

document.addEventListener("DOMContentLoaded", initMap);

function enviarDatosPorWhatsApp() {
    const detalleCostos = document.getElementById("detalle-costos").innerText;
    const mensaje = `Hola, quiero solicitar un viaje con los siguientes detalles:\n${detalleCostos}`;
    const url = `https://wa.me/5216393992678?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

const botonSolicitarViaje = document.getElementById("solicitarViajeBtn");
if (botonSolicitarViaje) {
    botonSolicitarViaje.addEventListener("click", enviarDatosPorWhatsApp);
}
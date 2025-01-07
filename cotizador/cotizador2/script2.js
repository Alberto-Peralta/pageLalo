let map;
let origenMarker;
let destinoMarker;
let directionsService;
let directionsRenderer;
let userLocation;
let viajeIniciado = false;
let inicioViaje, finViaje;
let locationInterval; // Variable para almacenar el intervalo de geolocalización
let carMarker;  // Marcador para el automóvil
// URL del ícono del automóvil
const carIconUrl = '../icons/car.png'; // Reemplaza con la URL del ícono que has descargado o el enlace directo

function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        alert("No se encontró el contenedor del mapa.");
        return;
    }
    const styledMapType = new google.maps.StyledMapType(
        [
            { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#f5f1e6" }] },
        ],
        { name: "Styled Map" }
    );
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
                    gestureHandling: "auto",
                    mapTypeControlOptions: {
                        mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain", "styled_map"],
                    },
                });
                map.mapTypes.set("styled_map", styledMapType);
                map.setMapTypeId("styled_map");
                // Inicializa los marcadores
                origenMarker = new google.maps.Marker({
                    position: userLocation,
                    map,
                    draggable: true,
                    label: "O",
                    title: "Origen (arrástrame)",
                });
                destinoMarker = new google.maps.Marker({
                    position: {
                        lat: userLocation.lat + 0.01,
                        lng: userLocation.lng + 0.01,
                    },
                    map,
                    draggable: true,
                    label: "D",
                    title: "Destino (arrástrame)",
                });
                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({ map });
                // Actualiza la ruta y centra el mapa
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
                updateRouteAndCenter();
                // Autocompletar para origen y destino
                const autocompleteOptions = {
                    bounds: new google.maps.LatLngBounds(
                        new google.maps.LatLng(userLocation.lat - 0.1, userLocation.lng - 0.1),
                        new google.maps.LatLng(userLocation.lat + 0.1, userLocation.lng + 0.1)
                    ),
                    strictBounds: false,
                };
                const originInput = document.getElementById("origen");
                const destinationInput = document.getElementById("destino");
                const autocompleteOrigen = new google.maps.places.Autocomplete(originInput, autocompleteOptions);
                const autocompleteDestino = new google.maps.places.Autocomplete(destinationInput, autocompleteOptions);
                // Listener para actualizar marcadores con Autocompletar
                autocompleteOrigen.addListener("place_changed", () => {
                    const place = autocompleteOrigen.getPlace();
                    if (place.geometry) {
                        origenMarker.setPosition(place.geometry.location);
                        map.setCenter(place.geometry.location);
                        updateFormFields();
                        calculateRoute();
                    }
                });
                autocompleteDestino.addListener("place_changed", () => {
                    const place = autocompleteDestino.getPlace();
                    if (place.geometry) {
                        destinoMarker.setPosition(place.geometry.location);
                        map.setCenter(place.geometry.location);
                        updateFormFields();
                        calculateRoute();
                    }
                });
                // Añadir eventos a los botones
                document.getElementById("iniciar-viaje").addEventListener("click", iniciarViaje);
                document.getElementById("finalizar-viaje").addEventListener("click", finalizarViaje);
            },
            () => {
                alert("No se pudo obtener tu ubicación.");
            }
        );
    } else {
        alert("La geolocalización no es soportada por tu navegador.");
    }
}

function updateFormFields() {
    const originInput = document.getElementById("origen");
    const destinationInput = document.getElementById("destino");
    const originPosition = origenMarker.getPosition();
    const destinationPosition = destinoMarker.getPosition();
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: originPosition }, (results, status) => {
        if (status === "OK" && results[0]) {
            originInput.value = results[0].formatted_address;
        }
    });
    geocoder.geocode({ location: destinationPosition }, (results, status) => {
        if (status === "OK" && results[0]) {
            destinationInput.value = results[0].formatted_address;
        }
    });
}

function calculateRoute() {
    const origin = origenMarker.getPosition();
    const destination = destinoMarker.getPosition();
    const serviceType = document.getElementById("servicio")?.value || "economico";
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
                const distance = routeLeg.distance.value / 1000; // km
                const duration = routeLeg.duration.value / 60; // min
                const baseFare = 35;
                const costPerKm = serviceType === "economico" ? 5 : serviceType === "estandar" ? 7 : 10;
                const costPerMinute = serviceType === "economico" ? 2 : serviceType === "estandar" ? 3 : 5;
                const estimate = baseFare + distance * costPerKm + duration * costPerMinute;
                document.getElementById("detalle-costos").innerText = `
                    Tipo de servicio: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                    Distancia: ${distance.toFixed(2)} km
                    Tiempo estimado: ${duration.toFixed(0)} minutos
                    Costo estimado: $${estimate.toFixed(2)}
                `;
            } else {
                alert("No se pudo calcular la ruta. Intenta nuevamente.");
            }
        }
    );
}

function iniciarViaje() {
    if (!viajeIniciado) {
        viajeIniciado = true;
        inicioViaje = new Date();
        userLocation = origenMarker.getPosition();
        carMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            icon: createCarIcon(0),
            title: "Vehículo en movimiento",
        });
        animateMarker();
        document.getElementById("iniciar-viaje").disabled = true;
        document.getElementById("finalizar-viaje").disabled = false;
        alert("Viaje iniciado.");
    } else {
        alert("El viaje ya está en curso.");
    }
}

function animateMarker() {
    const route = directionsRenderer.getDirections().routes[0].overview_path;
    if (!route || route.length === 0) {
        alert("No hay ruta disponible para animar.");
        return;
    }
    let step = 0;
    locationInterval = setInterval(() => {
        if (step < route.length) {
            carMarker.setPosition(route[step]);
            step++;
        } else {
            clearInterval(locationInterval);
        }
    }, 1000);
}

function finalizarViaje() {
    if (viajeIniciado) {
        viajeIniciado = false;
        finViaje = new Date();
        const totalTime = Math.round((finViaje - inicioViaje) / 60000); // en minutos
        const totalKm = google.maps.geometry.spherical.computeDistanceBetween(origenMarker.getPosition(), destinoMarker.getPosition()) / 1000;
        const totalCost = calculateCost(totalKm, totalTime);
        document.getElementById("detalle-costos").innerText = `
            Viaje finalizado.
            Distancia recorrida: ${totalKm.toFixed(2)} km
            Duración: ${totalTime} minutos
            Costo total: $${totalCost.toFixed(2)}
        `;
        carMarker.setMap(null);  // Elimina el marcador del vehículo
        document.getElementById("finalizar-viaje").disabled = true;
        document.getElementById("iniciar-viaje").disabled = false;
        alert("Viaje finalizado.");
    } else {
        alert("El viaje aún no ha comenzado.");
    }
}

function calculateCost(distance, duration) {
    const serviceType = document.getElementById("servicio")?.value || "economico";
    const baseFare = 35;
    const costPerKm = serviceType === "economico" ? 5 : serviceType === "estandar" ? 7 : 10;
    const costPerMinute = serviceType === "economico" ? 2 : serviceType === "estandar" ? 3 : 5;
    return baseFare + (distance * costPerKm) + (duration * costPerMinute);
}

function createCarIcon(step) {
    return {
        url: carIconUrl,
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15),
    };
}

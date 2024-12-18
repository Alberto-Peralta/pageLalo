let map;
let origenMarker;
let destinoMarker;
let directionsService;
let directionsRenderer;
let userLocation;
let viajeIniciado = false;
let inicioViaje, finViaje;
let locationInterval;
let carMarker;
let routePath = [];
let stopTimes = [];
let lastStopTime = 0;
let carIconUrl = '../icons/car.png';

function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return alert("No se encontró el contenedor del mapa.");
    
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
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            map = new google.maps.Map(mapElement, {
                center: userLocation,
                zoom: 14,
                gestureHandling: "auto",
                mapTypeControlOptions: { mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain", "styled_map"] },
            });
            
            map.mapTypes.set("styled_map", styledMapType);
            map.setMapTypeId("styled_map");
            
            initializeMarkers();
            initializeAutocomplete();
        }, () => alert("No se pudo obtener tu ubicación."));
    } else {
        alert("La geolocalización no es soportada por tu navegador.");
    }
}

function initializeMarkers() {
    origenMarker = createMarker(userLocation, "O", "Origen (arrástrame)");
    destinoMarker = createMarker({ lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01 }, "D", "Destino (arrástrame)");
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });
    
    origenMarker.addListener("dragend", updateRouteAndCenter);
    destinoMarker.addListener("dragend", updateRouteAndCenter);
    
    updateRouteAndCenter();
}

function createMarker(position, label, title) {
    return new google.maps.Marker({
        position,
        map,
        draggable: true,
        label,
        title
    });
}

function updateRouteAndCenter() {
    calculateRoute();
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origenMarker.getPosition());
    bounds.extend(destinoMarker.getPosition());
    map.fitBounds(bounds);
    updateFormFields();
}

function updateFormFields() {
    const originInput = document.getElementById("origen");
    const destinationInput = document.getElementById("destino");
    const geocoder = new google.maps.Geocoder();
    
    geocodeLocation(origenMarker.getPosition(), result => originInput.value = result);
    geocodeLocation(destinoMarker.getPosition(), result => destinationInput.value = result);
}

function geocodeLocation(location, callback) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
        if (status === "OK" && results[0]) callback(results[0].formatted_address);
    });
}

function initializeAutocomplete() {
    const autocompleteOptions = { bounds: new google.maps.LatLngBounds(userLocation), strictBounds: false };
    const originInput = document.getElementById("origen");
    const destinationInput = document.getElementById("destino");
    
    setupAutocomplete(originInput, origenMarker);
    setupAutocomplete(destinationInput, destinoMarker);
}

function setupAutocomplete(input, marker) {
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            marker.setPosition(place.geometry.location);
            map.setCenter(place.geometry.location);
            updateFormFields();
            calculateRoute();
        }
    });
}

function calculateRoute() {
    directionsService.route({
        origin: origenMarker.getPosition(),
        destination: destinoMarker.getPosition(),
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === "OK") directionsRenderer.setDirections(response);
        else alert("No se pudo calcular la ruta. Intenta nuevamente.");
    });
}

function iniciarViaje() {
    if (viajeIniciado) return alert("El viaje ya está en curso.");
    
    viajeIniciado = true;
    inicioViaje = new Date();
    userLocation = origenMarker.getPosition();
    
    carMarker = new google.maps.Marker({
        position: userLocation,
        map,
        icon: createCarIcon(),
        title: "Vehículo en movimiento"
    });
    
    routePath = [];
    animateMarker();
    
    document.getElementById("iniciar-viaje").disabled = true;
    document.getElementById("finalizar-viaje").disabled = false;
}

function animateMarker() {
    const route = directionsRenderer.getDirections().routes[0]?.overview_path;
    if (!route) return alert("No hay ruta disponible para animar.");
    
    let step = 0;
    locationInterval = setInterval(() => {
        if (step < route.length) {
            carMarker.setPosition(route[step]);
            routePath.push(route[step]);
            step++;
        } else clearInterval(locationInterval);
    }, 1000);
}

function finalizarViaje() {
    if (!viajeIniciado) return alert("El viaje aún no ha comenzado.");
    
    viajeIniciado = false;
    finViaje = new Date();
    const totalTime = Math.round((finViaje - inicioViaje) / 60000);
    const totalKm = google.maps.geometry.spherical.computeLength(routePath) / 1000;
    const totalCost = calculateCost(totalKm, totalTime);
    
    document.getElementById("detalle-costos").innerText = `Distancia: ${totalKm.toFixed(2)} km, Duración: ${totalTime} min, Costo: $${totalCost.toFixed(2)}`;
    carMarker.setMap(null);
} 

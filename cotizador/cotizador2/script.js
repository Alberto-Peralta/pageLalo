let map;
let carMarker;
let directionsService;
let directionsRenderer;
let userLocation;
let viajeIniciado = false;
let inicioViaje, finViaje;
let routePath = [];

function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        alert("No se encontró el contenedor del mapa.");
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            
            map = new google.maps.Map(mapElement, {
                center: userLocation,
                zoom: 14,
                gestureHandling: "auto",
                mapTypeControl: false,
            });

            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer({ map });
            
            startTrackingVehicle();
        }, () => alert("No se pudo obtener tu ubicación."));
    } else {
        alert("La geolocalización no es soportada por tu navegador.");
    }
}

function startTrackingVehicle() {
    carMarker = new google.maps.Marker({
        position: userLocation,
        map,
        icon: {
            url: '../icons/car.png',
            scaledSize: new google.maps.Size(50, 50),
        },
        title: "Vehículo en movimiento"
    });
    
    navigator.geolocation.watchPosition(updateVehiclePosition, () => alert("No se pudo obtener la nueva posición."), {
        enableHighAccuracy: true, 
        maximumAge: 0 
    });
}

function updateVehiclePosition(position) {
    const newPosition = { lat: position.coords.latitude, lng: position.coords.longitude };
    
    if (carMarker) {
        carMarker.setPosition(newPosition);
    }
    
    if (!viajeIniciado) {
        map.setCenter(newPosition);
    }
    
    routePath.push(newPosition);
}

function iniciarViaje() {
    if (viajeIniciado) return alert("El viaje ya está en curso.");
    
    viajeIniciado = true;
    inicioViaje = new Date();
    document.getElementById("iniciar-viaje").disabled = true;
    document.getElementById("finalizar-viaje").disabled = false;
}

function finalizarViaje() {
    if (!viajeIniciado) return alert("El viaje aún no ha comenzado.");
    
    viajeIniciado = false;
    finViaje = new Date();
    const totalTime = Math.round((finViaje - inicioViaje) / 60000);
    const totalKm = google.maps.geometry.spherical.computeLength(routePath) / 1000;
    const totalCost = calculateCost(totalKm, totalTime);
    
    document.getElementById("detalle-costos").innerText = `Distancia: ${totalKm.toFixed(2)} km, Duración: ${totalTime} min, Costo: $${totalCost.toFixed(2)}`;
    
    if (carMarker) {
        carMarker.setMap(null);
    }
} 

function calculateCost(distance, time) {
    const costPerKm = 10; 
    const costPerMinute = 2; 
    return (distance * costPerKm) + (time * costPerMinute);
}

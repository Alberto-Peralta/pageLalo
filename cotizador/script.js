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

    const styledMapType = new google.maps.StyledMapType(
        [
            { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#f5f1e6" }] },
        ],
        { name: "Lalo Peralta Map" }
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
                    gestureHandling: "cooperative",
                    mapTypeControlOptions: {
                        mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain", "styled_map"],
                    },
                });

                map.mapTypes.set("styled_map", styledMapType);
                map.setMapTypeId("styled_map");


                
               // Marcador de Origen
origenMarker = new google.maps.Marker({
    position: userLocation,
    map,
    draggable: true,
    label: {
        text: "Origen",
        color: "#194756", // Color del texto
        fontSize: "14px",  // Tamaño del texto
        fontWeight: "bold" // Peso del texto
    },
    title: "Origen (arrástrame)",
    animation: google.maps.Animation.DROP, // Animación de caída
    icon: {
        url: "../icons/icons8-marcador-50.png", // Usa un ícono diferente para origen
        scaledSize: new google.maps.Size(50, 50), // Tamaño del ícono
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(25, 50), // Ajuste de anclaje
    },
});

// Marcador de Destino
destinoMarker = new google.maps.Marker({
    position: {
        lat: userLocation.lat + 0.01,
        lng: userLocation.lng + 0.01,
    },
    map,
    draggable: true,
    label: {
        text: "Destino",
        color: "#194756", // Color del texto
        fontSize: "14px",  // Tamaño del texto
        fontWeight: "bold" // Peso del texto
    },
    title: "Destino (arrástrame)",
    animation: google.maps.Animation.DROP, // Animación de caída
    icon: {
        url: "../icons/icons8-marcador-50.png", // Usa un ícono diferente para destino
        scaledSize: new google.maps.Size(50, 50), // Tamaño del ícono
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(25, 50), // Ajuste de anclaje
    },
});
           


                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({ 
                    map: map, 
                    suppressMarkers: true // Evita que se creen los marcadores A y B
                });
                
                const originInput = document.getElementById("origen");
                const destinationInput = document.getElementById("destino");

                const originAutocomplete = new google.maps.places.Autocomplete(originInput, {
                    bounds: new google.maps.LatLngBounds(userLocation), // Limita la búsqueda
                    strictBounds: false, // Fuerza la búsqueda solo dentro de los límites
                    fields: ["place_id", "geometry", "name", "formatted_address"], // Obtén información útil del lugar
                    types: [], // Puedes ajustar los tipos (por ejemplo, 'address' para solo direcciones)
                });
                
                const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, {
                    bounds: new google.maps.LatLngBounds(userLocation), 
                    strictBounds: false, 
                    fields: ["place_id", "geometry", "name", "formatted_address"],
                    types: [],
                });
                

                originAutocomplete.addListener("place_changed", () => {
                    const place = originAutocomplete.getPlace();
                    if (place.geometry) {
                        origenMarker.setPosition(place.geometry.location);
                        updateRouteAndCenter();
                    }
                });

                destinationAutocomplete.addListener("place_changed", () => {
                    const place = destinationAutocomplete.getPlace();
                    if (place.geometry) {
                        destinoMarker.setPosition(place.geometry.location);
                        updateRouteAndCenter();
                    }
                });

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



// Definir las zonas y tarifas fijas
const ZONAS_TARIFAS = {
    aeropuerto: {
        lat: 19.4361, // Coordenada aproximada del aeropuerto
        lng: -99.0719,
        radio: 5000, // Radio en metros
        tarifa: 150, // Tarifa fija
    },
    centro: {
        lat: 19.4326, // Coordenada aproximada del centro
        lng: -99.1332,
        radio: 3000, // Radio en metros
        tarifa: 100, // Tarifa fija
    },
};

// Función para verificar si una ubicación está dentro de una zona con tarifa fija
function estaEnZonaEspecial(lat, lng) {
    for (const zona in ZONAS_TARIFAS) {
        const { lat: zonaLat, lng: zonaLng, radio } = ZONAS_TARIFAS[zona];
        const distancia = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(lat, lng),
            new google.maps.LatLng(zonaLat, zonaLng)
        );
        
        if (distancia <= radio) {
            return ZONAS_TARIFAS[zona].tarifa; // Retorna la tarifa si está en la zona
        }
    }
  
};




function calculateRoute() {
    const origin = origenMarker.getPosition();
    const destination = destinoMarker.getPosition();

    if (!origin || !destination) {
        alert("Por favor arrastra los marcadores al origen y destino.");
        return;
    }



    let tarifaFija = 0;

    // Verificar si el origen está en una zona especial
    const tarifaOrigen = estaEnZonaEspecial(origin.lat(), origin.lng());
    if (tarifaOrigen) tarifaFija += tarifaOrigen;
    
    // Verificar si el destino está en una zona especial
    const tarifaDestino = estaEnZonaEspecial(destination.lat(), destination.lng());
    if (tarifaDestino) tarifaFija += tarifaDestino;
    







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
                const distance = routeLeg.distance.value / 1000;
                const duration = routeLeg.duration.value / 60;

                const baseFare = 35;
                const costPerKm = 5.25;
                const costPerMinute = 2;

                 // Añadir la tarifa fija a la estimación
                const estimate = baseFare + distance * costPerKm + duration * costPerMinute + tarifaFija;

                
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat()},${origin.lng()}&destination=${destination.lat()},${destination.lng()}`;

                document.getElementById("detalle-costos").innerHTML = `
                
                    <p>Distancia: ${distance.toFixed(2)} km</p>
                    <p>Tiempo estimado: ${duration.toFixed(0)} minutos</p>
                    <p>Costo estimado: $${estimate.toFixed(2)}</p>
                    <p id="enlace-mapa"><a target="_blank" href="">${googleMapsUrl}</a></p>`;            
            } else {
                alert("No se pudo calcular la ruta. Intenta nuevamente.");
            }
        }
    );
}



// Manejador de clic para el botón
document.getElementById("solicitarViajeBtn").addEventListener("click", enviarWhatsApp);

function enviarWhatsApp() {
    // Obtener el contenido de los detalles de costos (asegurarse que estén visibles)
    const detalleCostos = document.getElementById("detalle-costos").innerText;

    // Validar si los detalles están disponibles
    if (!detalleCostos) {
        alert("Por favor, calcula la ruta primero.");
        return;
    }

    // Generar el mensaje con los detalles
    const mensaje = `Hola, quiero solicitar un viaje con estos detalles:\n\n${detalleCostos}`;
    
    // Crear el enlace para WhatsApp
    const whatsappLink = `https://api.whatsapp.com/send?phone=+5216393992678&text=${encodeURIComponent(mensaje)}`;

    // Abrir WhatsApp con el mensaje cuando se presiona el botón
    window.open(whatsappLink, '_blank');
}




document.addEventListener("DOMContentLoaded", initMap);

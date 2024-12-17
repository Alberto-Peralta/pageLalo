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


                
                // Crear marcador de origen
origenMarker = new google.maps.Marker({
    position: userLocation,
    map,
    draggable: true,
    label: "",
    title: "Origen (arrástrame)",
    icon: {
        url: "https://img.icons8.com/ios/50/0000FF/leaf.png", // Nuevo ícono amigable
        scaledSize: new google.maps.Size(60, 60), // Tamaño ajustado
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(30, 60), // Centrado del ícono
        // Se agrega sombra para darle un toque más suave
        shadow: {
            url: "https://img.icons8.com/ios/50/000000/leaf.png", // Sombra de color más oscuro
            scaledSize: new google.maps.Size(70, 70), // Sombra un poco más grande
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(35, 70), // Centrado de la sombra
        },
    },
});

// Crear marcador de destino
destinoMarker = new google.maps.Marker({
    position: {
        lat: userLocation.lat + 0.01,
        lng: userLocation.lng + 0.01,
    },
    map,
    draggable: true,
    label: "",
    title: "Destino (arrástrame)",
    icon: {
        url: "https://img.icons8.com/ios/50/0000FF/earth.png", // Nuevo ícono amigable
        scaledSize: new google.maps.Size(60, 60), // Tamaño ajustado
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(30, 60), // Centrado del ícono
        // Sombra para hacer el marcador más "pachón"
        shadow: {
            url: "https://img.icons8.com/ios/50/000000/earth.png", // Sombra más oscura
            scaledSize: new google.maps.Size(70, 70),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(35, 70),
        },
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
                    strictBounds: true, // Fuerza la búsqueda solo dentro de los límites
                    fields: ["place_id", "geometry", "name", "formatted_address"], // Obtén información útil del lugar
                    types: ["establishment", "geocode"], // Puedes ajustar los tipos (por ejemplo, 'address' para solo direcciones)
                });
                
                const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, {
                    bounds: new google.maps.LatLngBounds(userLocation), 
                    strictBounds: true, 
                    fields: ["place_id", "geometry", "name", "formatted_address"],
                    types: ["establishment", "geocode"],
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
                const distance = routeLeg.distance.value / 1000;
                const duration = routeLeg.duration.value / 60;

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
                    <p id="enlace-mapa"><a target="_blank" href="${googleMapsUrl}">${googleMapsUrl}</a></p>
                `;
            } else {
                alert("No se pudo calcular la ruta. Intenta nuevamente.");
            }
        }
    );
}

document.addEventListener("DOMContentLoaded", initMap);

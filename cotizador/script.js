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
                // Inicializa el marcador de origen en la ubicación actual
                origenMarker = new google.maps.Marker({
                    position: userLocation,
                    map,
                    draggable: true,
                    label: "O",
                    title: "Origen (arrástrame)",
                });
                // Inicializa el marcador de destino un poco alejado
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
                const updateRouteAndCenter = () => {
                    calculateRoute();
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(origenMarker.getPosition());
                    bounds.extend(destinoMarker.getPosition());
                    map.fitBounds(bounds); // Ajusta el zoom para incluir ambos marcadores
                    // Actualizar los formularios de origen y destino
                    updateFormFields();
                };
                origenMarker.addListener("dragend", updateRouteAndCenter);
                destinoMarker.addListener("dragend", updateRouteAndCenter);
                // Inicializa la ruta por defecto
                updateRouteAndCenter();
                // Inicializar Autocompletado para los campos de origen y destino
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
                // Listener para actualizar el marcador de origen
                autocompleteOrigen.addListener("place_changed", () => {
                    const place = autocompleteOrigen.getPlace();
                    if (place.geometry) {
                        origenMarker.setPosition(place.geometry.location);
                        map.setCenter(place.geometry.location);
                        updateFormFields(); // Actualiza el campo de origen
                        calculateRoute();
                    }
                });
                // Listener para actualizar el marcador de destino
                autocompleteDestino.addListener("place_changed", () => {
                    const place = autocompleteDestino.getPlace();
                    if (place.geometry) {
                        destinoMarker.setPosition(place.geometry.location);
                        map.setCenter(place.geometry.location);
                        updateFormFields(); // Actualiza el campo de destino
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
    // Obtener las posiciones de los marcadores
    const originPosition = origenMarker.getPosition();
    const destinationPosition = destinoMarker.getPosition();
    // Usar el servicio de Geocoding para obtener las direcciones
    const geocoder = new google.maps.Geocoder();
    // Actualizar el campo de origen
    geocoder.geocode({ location: originPosition }, (results, status) => {
        if (status === "OK" && results[0]) {
            originInput.value = results[0].formatted_address; // Actualiza el campo de origen
        }
    });
    // Actualizar el campo de destino
    geocoder.geocode({ location: destinationPosition }, (results, status) => {
        if (status === "OK" && results[0]) {
            destinationInput.value = results[0].formatted_address; // Actualiza el campo de destino
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
                const route = response.routes[0]; // Obtén la ruta
                
                // Calcular el costo y mostrar detalles (como ya estaba)
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
        inicioViaje = new Date(); // Guardar la hora de inicio

        userLocation = origenMarker.getPosition(); // Usar la posición inicial del marcador

        // Crear marcador del automóvil
        carMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            icon: createCarIcon(0), // Ícono sin rotación
            title: "Vehículo en movimiento",
        });

        // Animar el marcador a lo largo de la ruta
        animateMarker();

        // Actualizar el estado de los botones
        document.getElementById("iniciar-viaje").disabled = true;
        document.getElementById("finalizar-viaje").disabled = false;

        alert("Viaje iniciado.");
    } else {
        alert("El viaje ya está en curso.");
    }
}


function animateMarker() {
    const route = directionsRenderer.getDirections().routes[0].overview_path; // Ruta simplificada
    if (!route || route.length === 0) {
        alert("No hay ruta disponible para animar.");
        return;
    }

    let step = 0; // Índice del punto en la ruta
    const intervalTime = 50; // Tiempo entre actualizaciones (ms)

    carMarker = new google.maps.Marker({
        position: route[0], // Empieza en el primer punto
        map: map,
        icon: createCarIcon(0), // Icono inicial sin rotación
        title: "Vehículo en movimiento",
    });

    const animationInterval = setInterval(() => {
        if (step < route.length - 1) {
            const currentPoint = route[step];
            const nextPoint = route[step + 1];

            // Calcular la rotación para el siguiente punto
            const heading = calculateHeading(currentPoint, nextPoint);

            // Actualizar la posición y la rotación del marcador
            carMarker.setPosition(nextPoint);
            carMarker.setIcon(createCarIcon(heading)); // Actualizar el ícono con rotación
            map.panTo(nextPoint); // Centrar el mapa en el marcador
            step++;
        } else {
            clearInterval(animationInterval); // Detener la animación al final de la ruta
            alert("El viaje ha finalizado.");
        }
    }, intervalTime);
}


// Función para calcular el ángulo de rotación entre dos puntos
function calculateHeading(point1, point2) {
    const lat1 = point1.lat();
    const lng1 = point1.lng();
    const lat2 = point2.lat();
    const lng2 = point2.lng();
    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const heading = Math.atan2(y, x) * (180 / Math.PI); // Convertir a grados
    return (heading + 360) % 360; // Asegurarse de que esté entre 0 y 360
}

function createCarIcon(rotation) {
    return {
        url: carIconUrl,  // URL del ícono del automóvil
        scaledSize: new google.maps.Size(32, 32), // Tamaño ajustado del ícono
        origin: new google.maps.Point(0, 0), // Origen del ícono
        anchor: new google.maps.Point(16, 16), // Punto de anclaje (centro del ícono)
        rotation: rotation,  // Rotación dinámica
    };
}




function actualizarUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            // Actualizar la posición del marcador de origen
            origenMarker.setPosition(newLocation);
            // Opcional: Centrar el mapa en la nueva ubicación
            map.setCenter(newLocation);
        }, (error) => {
            console.error("Error al obtener la ubicación: ", error);
        });
    } else {
        alert("La geolocalización no es soportada por tu navegador.");
    }
}






function finalizarViaje() {
    if (viajeIniciado) {
        viajeIniciado = false;
        finViaje = new Date(); // Guardar la hora de finalización

        clearInterval(locationInterval); // Detener actualizaciones de ubicación

        // Deshabilitar el botón de finalizar y habilitar el de iniciar
        document.getElementById("iniciar-viaje").disabled = false;
        document.getElementById("finalizar-viaje").disabled = true;

        // Mostrar resumen del viaje
        calculateRouteAndDisplaySummary();

        alert("Viaje finalizado.");
    } else {
        alert("No hay un viaje en curso.");
    }
}


function calculateRouteAndDisplaySummary() {
    const origin = origenMarker.getPosition();
    const destination = destinoMarker.getPosition();
    const serviceType = document.getElementById("servicio")?.value || "economico"; // Obtener el tipo de servicio
    
    // Llamar al servicio de direcciones para obtener la ruta
    directionsService.route(
        {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                console.log("Ruta calculada correctamente", response); // Depuración
                directionsRenderer.setDirections(response); // Renderizar la ruta en el mapa
                const route = response.routes[0].legs[0]; // Obtener el primer trayecto de la ruta
                const distance = route.distance.value / 1000; // Distancia en km
                const duration = route.duration.value / 60; // Duración en minutos

                // Calcular el costo basado en el tipo de servicio
                const baseFare = 35;
                const costPerKm = serviceType === "economico" ? 5 : serviceType === "estandar" ? 7 : 10;
                const costPerMinute = serviceType === "economico" ? 2 : serviceType === "estandar" ? 3 : 5;
                const totalEstimate = baseFare + distance * costPerKm + duration * costPerMinute;

                // Crear el resumen con la distancia, tiempo y costo
                const summary = `
                    Viaje Finalizado:
                    Distancia: ${distance.toFixed(2)} km
                    Tiempo: ${duration.toFixed(0)} minutos
                    Costo Total: $${totalEstimate.toFixed(2)}
                    Hora de Inicio: ${inicioViaje.toLocaleTimeString()}
                    Hora de Finalización: ${finViaje.toLocaleTimeString()}
                `;

                // Actualizar el cuadro de costos estimados con el resumen
                const costosContainer = document.getElementById("detalle-costos");
                if (costosContainer) {
                    costosContainer.innerText = summary;
                } else {
                    console.error("No se encontró el contenedor de costos.");
                }

            } else {
                console.error("No se pudo calcular la ruta: ", status);
                alert("No se pudo calcular la ruta. Intenta nuevamente.");
            }
        }
    );
}




function calculateRouteAndDisplaySummary() {
    const origin = origenMarker.getPosition();
    const destination = destinoMarker.getPosition();
    const serviceType = document.getElementById("servicio")?.value || "economico"; // Obtener el tipo de servicio
    
    // Llamar al servicio de direcciones para obtener la ruta
    directionsService.route(
        {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response); // Renderizar la ruta en el mapa
                const route = response.routes[0].legs[0]; // Obtener el primer trayecto de la ruta
                const distance = route.distance.value / 1000; // Distancia en km
                const duration = route.duration.value / 60; // Duración en minutos

                // Calcular el costo basado en el tipo de servicio
                const baseFare = 35;
                const costPerKm = serviceType === "economico" ? 5 : serviceType === "estandar" ? 7 : 10;
                const costPerMinute = serviceType === "economico" ? 2 : serviceType === "estandar" ? 3 : 5;
                const totalEstimate = baseFare + distance * costPerKm + duration * costPerMinute;

                // Crear el resumen con la distancia, tiempo y costo
                const summary = `
                    Viaje Finalizado:
                    Distancia: ${distance.toFixed(2)} km
                    Tiempo: ${duration.toFixed(0)} minutos
                    Costo Total: $${totalEstimate.toFixed(2)}
                    Hora de Inicio: ${inicioViaje.toLocaleTimeString()}
                    Hora de Finalización: ${finViaje.toLocaleTimeString()}
                `;

                // Actualizar el cuadro de costos estimados con el resumen
                document.getElementById("detalle-costos").innerText = summary;
            } else {
                alert("No se pudo calcular la ruta. Intenta nuevamente.");
            }
        }
    );
}


function animateMarker(route) {
    const path = route.overview_path; // Ruta simplificada
    const marker = new google.maps.Marker({
        position: path[0], // Comienza en el primer punto
        map,
        icon: createCarIcon(0), // Ícono inicial (sin rotación)
        title: "Vehículo en movimiento",
    });
    let step = 0; // Índice del punto en la ruta
    const intervalTime = 50; // Tiempo entre actualizaciones (ms)
    const animationInterval = setInterval(() => {
        if (step < path.length - 1) {
            const currentPoint = path[step];
            const nextPoint = path[step + 1];
            // Calcular la rotación
            const heading = calculateHeading(currentPoint, nextPoint);
            // Actualizar la posición y la rotación del marcador
            marker.setPosition(nextPoint);
            marker.setIcon(createCarIcon(heading)); // Actualizar el ícono con la rotación
            map.panTo(nextPoint); // Centrar el mapa en el marcador
            step++;
        } else {
            clearInterval(animationInterval); // Detener la animación al final de la ruta
            alert("El viaje ha finalizado.");
        }
    }, intervalTime);
}

function calculateHeading(point1, point2) {
    const lat1 = point1.lat();
    const lng1 = point1.lng();
    const lat2 = point2.lat();
    const lng2 = point2.lng();
    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const heading = Math.atan2(y, x) * (180 / Math.PI); // Convertir a grados
    return (heading + 360) % 360; // Asegurarse de que esté entre 0 y 360
}

function createCarIcon(rotation) {
    return {
        url: carIconUrl,  // Usar la URL del ícono PNG
        size: new google.maps.Size(32, 32),  // Tamaño del ícono
        origin: new google.maps.Point(0, 0),  // Origen del ícono
        anchor: new google.maps.Point(16, 16),  // Anclar el ícono en el centro
        scaledSize: new google.maps.Size(32, 32),  // Escalar el ícono
        rotation: rotation,  // Rotación dinámica
    };
}

document.addEventListener("DOMContentLoaded", initMap);
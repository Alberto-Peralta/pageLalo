// netlify/functions/magisterium-proxy.js

// Importa la biblioteca de 'node-fetch' para hacer peticiones HTTP en Node.js
// Si no la tienes instalada, puedes hacerlo con 'npm install node-fetch'
// Pero Netlify Functions ya incluye muchas dependencias comunes.

exports.handler = async (event, context) => {
    // Solo permitimos solicitudes POST para este endpoint
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        // Obtenemos el cuerpo de la solicitud JSON de nuestro frontend
        const body = JSON.parse(event.body);
        const { prompt } = body;

        // Validar que el prompt existe
        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El campo "prompt" es requerido.' }),
            };
        }

        // Accedemos a la clave de la API de forma segura desde las variables de entorno de Netlify
        const MAGISTERIUM_API_KEY = process.env.MAGISTERIUM_API_KEY;
        const MAGISTERIUM_API_URL = "https://www.magisterium.com/api/v1/chat/completions";

        // Realizamos la solicitud a la API de Magisterium
        const apiResponse = await fetch(MAGISTERIUM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAGISTERIUM_API_KEY}`
            },
            body: JSON.stringify({
                model: 'magisterium-1',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        // Verificamos si la respuesta de la API fue exitosa
        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            throw new Error(errorData.error.message || 'Error en la API de Magisterium');
        }

        const data = await apiResponse.json();

        // Devolvemos la respuesta de la API de Magisterium a nuestro frontend
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                // Netlify Functions maneja CORS automáticamente para este tipo de respuesta
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Error en la función proxy:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Error interno del servidor' }),
        };
    }
};
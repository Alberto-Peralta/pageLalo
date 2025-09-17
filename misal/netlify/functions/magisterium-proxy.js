// misal/netlify/functions/magisterium-proxy.js

export async function handler(event, context) {
  try {
    // Si llega un GET, devolvemos un mensaje de prueba
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Funciona el proxy (GET)" }),
      };
    }

    // Solo permitimos POST además de GET
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Método no permitido" };
    }

    // Obtenemos el cuerpo de la solicitud
    const body = JSON.parse(event.body || "{}");
    const { prompt } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El campo "prompt" es requerido.' }),
      };
    }

    // Accedemos a la clave de API desde variables de entorno de Netlify
    const MAGISTERIUM_API_KEY = process.env.MAGISTERIUM_API_KEY;
    const MAGISTERIUM_API_URL = "https://www.magisterium.com/api/v1/chat/completions";

    // Realizamos la solicitud a la API de Magisterium
    const apiResponse = await fetch(MAGISTERIUM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAGISTERIUM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "magisterium-1",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Error en Magisterium API: ${errorText}`);
    }

    const data = await apiResponse.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error en la función proxy:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Error interno del servidor" }),
    };
  }
}

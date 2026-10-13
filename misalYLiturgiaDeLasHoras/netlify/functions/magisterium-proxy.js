// netlify/functions/magisterium-proxy.js
// Acepta { messages: [{role, content}, ...] } (historial de la conversación)
// o, por compatibilidad con otras páginas, { prompt: "texto" }.

const MAX_MESSAGES = 12;   // últimos mensajes del historial que se reenvían
const MAX_CHARS = 6000;    // máximo de caracteres por mensaje del historial

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        const body = JSON.parse(event.body);
        let messages;

        if (Array.isArray(body.messages)) {
            messages = body.messages
                .filter(m => m && (m.role === 'user' || m.role === 'assistant')
                    && typeof m.content === 'string' && m.content.trim() !== '')
                .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
                .slice(-MAX_MESSAGES);
            // El historial debe empezar y terminar con un mensaje del usuario
            while (messages.length && messages[0].role !== 'user') messages.shift();
        } else if (typeof body.prompt === 'string' && body.prompt.trim() !== '') {
            messages = [{ role: 'user', content: body.prompt }];
        }

        if (!messages || messages.length === 0 || messages[messages.length - 1].role !== 'user') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Se requiere "messages" (terminando con un mensaje del usuario) o "prompt".' }),
            };
        }

        const MAGISTERIUM_API_KEY = process.env.MAGISTERIUM_API_KEY;
        const MAGISTERIUM_API_URL = "https://www.magisterium.com/api/v1/chat/completions";

        const apiResponse = await fetch(MAGISTERIUM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAGISTERIUM_API_KEY}`
            },
            body: JSON.stringify({
                model: 'magisterium-1',
                messages: messages
            })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            throw new Error(errorData.error.message || 'Error en la API de Magisterium');
        }

        const data = await apiResponse.json();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
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

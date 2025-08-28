const axios = require('axios');

exports.handler = async (event) => {
    // Check for POST method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }
    
    // Check if the API key is set as an environment variable
    if (!process.env.MAGISTERIUM_API_KEY) {
        return {
            statusCode: 500,
            body: 'API key not set as environment variable.',
        };
    }

    try {
        const { message } = JSON.parse(event.body);

        const response = await axios.post(
            'https://api.magisterium.ai/v1/chat/completions',
            {
                model: 'magisterium-1',
                messages: [
                    { role: 'system', content: 'Eres un asistente sobre doctrina y documentos de la Iglesia Católica. Responde a las preguntas de los usuarios con información precisa y referenciada.' },
                    { role: 'user', content: message },
                ],
                stream: false,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.MAGISTERIUM_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const botResponse = response.data.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ response: botResponse }),
        };
    } catch (error) {
        console.error('Error al llamar a la API de Magisterium:', error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error al procesar tu solicitud.' }),
        };
    }
};
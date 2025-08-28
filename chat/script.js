const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (message === '') return;

    appendMessage(message, 'user-message');
    userInput.value = '';

    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message';
    botMessage.textContent = 'Escribiendo...';
    chatBox.appendChild(botMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/.netlify/functions/chat-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            botMessage.textContent = data.response;
        } else {
            botMessage.textContent = 'Hubo un error al obtener la respuesta. Inténtalo de nuevo más tarde.';
        }
    } catch (error) {
        botMessage.textContent = 'Error de conexión. Por favor, revisa tu red.';
    } finally {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

function appendMessage(text, className) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.textContent = text;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
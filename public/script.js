document.addEventListener('DOMContentLoaded', () => {
    let ws;
    const startButton = document.getElementById('start-button');
    const status = document.getElementById('status');
    const chatLog = document.getElementById('chat-log');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const recordButton = document.getElementById('record-button');

    startButton.addEventListener('click', connectWebSocket);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function connectWebSocket() {
        ws = new WebSocket(`ws://${window.location.host}`);
        
        ws.onopen = () => {
            status.textContent = 'Connecting to assistant...';
        };

        ws.onclose = () => {
            status.textContent = 'Disconnected';
            messageInput.disabled = true;
            sendButton.disabled = true;
            recordButton.disabled = true;
            startButton.disabled = false;
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.type === 'status' && data.content === 'connected') {
                status.textContent = 'Connected';
                messageInput.disabled = false;
                sendButton.disabled = false;
                recordButton.disabled = false;
                startButton.disabled = true;
            }
            // ... rest of your message handling code
        };
    }

    // ... rest of your code
});

// Rest of your existing WebSocket handling code... 
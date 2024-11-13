const ws = new WebSocket(`ws://${window.location.host}`);
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const startButton = document.getElementById('start-button');

ws.onopen = () => {
    console.log('Connected to server');
};

// Add event listener for the start button
startButton.addEventListener('click', () => {
    const selectedChef = document.querySelector('input[name="chef"]:checked').value;
    console.log('Selected chef:', selectedChef);  // Debug log
    
    ws.send(JSON.stringify({
        type: 'init',
        chef: selectedChef
    }));
});

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // ... rest of your existing message handling code ...
};

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        ws.send(message);
        userInput.value = '';
    }
}

// Rest of your existing WebSocket handling code... 
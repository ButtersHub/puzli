document.addEventListener('DOMContentLoaded', () => {
    let ws;
    const startButton = document.getElementById('start-button');
    const status = document.getElementById('status');
    const chatLog = document.getElementById('chat-log');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const recordButton = document.getElementById('record-button');
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    startButton.addEventListener('click', connectWebSocket);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    recordButton.addEventListener('click', toggleRecord);

    function connectWebSocket() {
        ws = new WebSocket(`ws://${window.location.host}`);
        
        ws.onopen = () => {
            status.textContent = 'Connecting to assistant...';
            recordButton.disabled = true;
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

    async function toggleRecord() {
        if (!isRecording) {
            try {
                // Request microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // Create new MediaRecorder instance
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                // Handle data available event
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                // Handle recording stop
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    // Convert to base64 and send to server
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        const base64Audio = reader.result.split(',')[1];
                        ws.send(JSON.stringify({
                            type: 'audio',
                            data: base64Audio
                        }));
                    };
                    // Re-enable the record button after sending
                    recordButton.disabled = false;
                    recordButton.style.backgroundColor = '';  // Reset button color
                };

                // Start recording
                mediaRecorder.start();
                isRecording = true;
                recordButton.style.backgroundColor = 'red';  // Visual feedback
                console.log('Recording started');

            } catch (error) {
                console.error('Error accessing microphone:', error);
                alert('Unable to access microphone. Please check permissions.');
                recordButton.disabled = false;  // Re-enable on error
            }
        } else {
            // Stop recording
            mediaRecorder.stop();
            isRecording = false;
            recordButton.disabled = true;  // Temporarily disable while processing
            console.log('Recording stopped');
        }
    }

    // ... rest of your code
});

// Rest of your existing WebSocket handling code... 
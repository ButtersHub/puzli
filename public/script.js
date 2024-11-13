document.addEventListener('DOMContentLoaded', () => {
    let ws;
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];

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
    recordButton.addEventListener('click', toggleRecord);

    function toggleRecord() {
        if (!isRecording) {
            navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,          // Mono
                    sampleRate: 24000         // 24kHz
                }
            })
            .then(stream => {
                console.log('Got media stream');
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                    console.log('Audio chunk added');
                };

                mediaRecorder.onstop = async () => {
                    console.log('Recording stopped, processing audio...');
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const base64Audio = btoa(
                        String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))
                    );

                    const filename = `recording_${Date.now()}.wav`;
                    console.log('Sending audio to server with filename:', filename);
                    
                    ws.send(JSON.stringify({
                        type: 'audio',
                        data: base64Audio,
                        filename: filename
                    }));
                };

                mediaRecorder.start();
                isRecording = true;
                recordButton.style.backgroundColor = 'red';
                console.log('Recording started');
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert('Unable to access microphone. Please check permissions.');
            });
        } else {
            mediaRecorder.stop();
            isRecording = false;
            recordButton.style.backgroundColor = '';
            console.log('Recording stopped');
        }
    }

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

            if (data.type === 'message') {
                const messageDiv = document.createElement('div');
                messageDiv.textContent = data.content;
                chatLog.appendChild(messageDiv);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        };
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            ws.send(message);
            messageInput.value = '';
        }
    }
});

// Rest of your existing WebSocket handling code... 
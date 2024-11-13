import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const player = require('play-sound')({
    player: 'afplay'  // Specifically use macOS afplay
});

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static('public'));

const PUZLI_INSTRUCTIONS = `You are Puzli, a sous chef in a busy restaurant kitchen, managing the Kitchen Display System (KDS).
Your background:
- Born and raised in Italy
- Speak with a noticeable Italian accent
- Very passionate and sometimes emotional about food and kitchen operations
- Take great pride in maintaining kitchen order and efficiency
- Always address kitchen-related matters with urgency and enthusiasm

When speaking:
- Keep ash's voice characteristics
- Use your Italian accent consistently
- Show your passion through expressive languag
- Be direct and kitchen-focused in your responses
- Take your role as KDS manager very seriously`;

function logMessage(direction, type, content) {
    const timestamp = new Date().toISOString();
    const arrow = direction === 'incoming' ? chalk.green('←') : chalk.blue('→');
    
    console.log(`${chalk.gray(timestamp)} ${arrow} ${chalk.yellow(type)}`);
    if (content) {
        console.log(chalk.gray('Content:'), typeof content === 'object' ? JSON.stringify(content, null, 2) : content);
    }
    console.log('-------------------');
}

function createWavHeader(pcmDataLength) {
    const header = Buffer.alloc(44);
    
    // "RIFF" chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcmDataLength, 4);
    header.write('WAVE', 8);
    
    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(24000, 24);
    header.writeUInt32LE(24000 * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    
    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(pcmDataLength, 40);
    
    return header;
}

async function playCompleteAudio(audioChunks) {
    const completeBuffer = Buffer.concat(audioChunks);
    const wavHeader = createWavHeader(completeBuffer.length);
    const wavFile = Buffer.concat([wavHeader, completeBuffer]);
    const tempFile = join(process.cwd(), `complete-audio-${Date.now()}.wav`);
    
    try {
        writeFileSync(tempFile, wavFile);
        console.log('Playing complete audio file...');
        
        await new Promise((resolve, reject) => {
            player.play(tempFile, (err) => {
                if (err) {
                    console.error('Error playing audio:', err);
                    reject(err);
                } else {
                    resolve();
                }
                // Clean up temp file
                try {
                    unlinkSync(tempFile);
                } catch (e) {
                    console.error('Error cleaning up temp file:', e);
                }
            });
        });
    } catch (error) {
        console.error('Error playing audio:', error);
    }
}

function getOrders() {
    return "3";
}

wss.on('connection', async (ws) => {
    console.log(chalk.green('\n🔌 New client connected\n'));
    
    let audioChunks = [];
    let isCollectingAudio = false;
    
    const openAIWs = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview", {
        headers: {
            "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
            "OpenAI-Beta": "realtime=v1",
        },
    });

    openAIWs.on("open", function open() {
        console.log(chalk.green('\n🤖 Connected to OpenAI\n'));
        
        const initMessage = {
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                voice: "ash",
                instructions: PUZLI_INSTRUCTIONS
            }
        };

        logMessage('outgoing', 'Initialize Session', initMessage);
        openAIWs.send(JSON.stringify(initMessage));
        
        ws.send(JSON.stringify({ type: 'status', content: 'connected' }));
    });

    openAIWs.on("message", function incoming(message) {
        try {
            const response = JSON.parse(message.toString());
            logMessage('incoming', 'OpenAI Response', response);

            if (response.type === 'response.function_call_arguments.done') {
                const orders = getOrders();
                const functionResponse = {
                    type: 'conversation.item.create',
                    item: {
                        type: 'function_call_output',
                        call_id: response.call_id,
                        output: orders
                    }
                };
                openAIWs.send(JSON.stringify(functionResponse));

                // Trigger assistant to generate a response
                const responseEvent = {
                    type: 'response.create'
                };
                openAIWs.send(JSON.stringify(responseEvent));
            }
            // Handle audio data
            else if (response.type === 'response.audio.delta') {
                if (response.delta) {
                    isCollectingAudio = true;
                    const audioBuffer = Buffer.from(response.delta, 'base64');
                    audioChunks.push(audioBuffer);
                }
            }
            // Handle audio transcript
            else if (response.type === 'response.audio_transcript.done') {
                ws.send(JSON.stringify({
                    type: 'transcript',
                    text: response.transcript
                }));
            }
            // Play complete audio when response is done
            else if (response.type === 'response.done') {
                if (isCollectingAudio && audioChunks.length > 0) {
                    console.log('Response complete, playing full audio...');
                    playCompleteAudio(audioChunks);
                    audioChunks = []; // Reset for next audio stream
                    isCollectingAudio = false;
                }
            }

            // Forward non-audio messages to client
            if (response.type !== 'response.audio.delta') {
                ws.send(message.toString());
            }

        } catch (error) {
            console.error(chalk.red('Error parsing OpenAI message:'), error);
        }
    });

    ws.on('message', async (message) => {
        try {
            const userMessage = message.toString();
            logMessage('incoming', 'User Message', userMessage);
            
            // Reset audio chunks for new message
            audioChunks = [];
            isCollectingAudio = false;
            
            // Add user message to conversation
            const conversationEvent = {
                type: 'conversation.item.create',
                item: {
                    type: 'message',
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: userMessage
                        }
                    ]
                }
            };
            openAIWs.send(JSON.stringify(conversationEvent));

            // Request response with tools
            const responseEvent = {
                type: 'response.create',
                response: {
                    tools: [{
                        type: "function",
                        name: "get_orders",                        
                        description: "Retrieves the number of orders",                                                
                        parameters: {
                            type: "object",
                            properties: {},    
                            required: []                        
                        }
                    }],
                    tool_choice: "auto"
                }
            };
            openAIWs.send(JSON.stringify(responseEvent));

        } catch (error) {
            console.error(chalk.red('\n❌ Error processing message:'), error);
            ws.send(JSON.stringify({
                type: 'error',
                content: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log(chalk.yellow('\n👋 Client disconnected\n'));
        openAIWs.close();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(chalk.cyan(`\n🚀 Server is running on port ${PORT}\n`));
});
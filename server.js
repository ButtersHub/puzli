import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import wixService from './services/wixService.js';
import { handleGetOrders } from './handlers/get_orders.js';
import { getInstructions } from './constants/instructions.js';
import { handleChangeFulfillmentStatus } from './handlers/change_fulfillment_status.js';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { handleCloseRestaurant } from './handlers/close_restaurant.js';
import { handleOpenRestaurant } from './handlers/open_restaurant.js';
import { handleSetItemOutOfStock } from './handlers/set_item_out_of_stock.js';
ffmpeg.setFfmpegPath(ffmpegStatic);

const require = createRequire(import.meta.url);
const player = require('play-sound')({
    player: 'afplay'  // Specifically use macOS afplay
});

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

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
    header.writeUInt16LE(1, 20);           // PCM format
    header.writeUInt16LE(1, 22);           // Mono channel
    header.writeUInt32LE(24000, 24);       // Sample rate
    header.writeUInt32LE(24000 * 2, 28);   // Byte rate
    header.writeUInt16LE(2, 32);           // Block align
    header.writeUInt16LE(16, 34);          // Bits per sample
    
    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(pcmDataLength, 40);
    
    return header;
}

async function playCompleteAudio(audioChunks, ws) {
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
                    ws.send(JSON.stringify({ type: 'waves', action: 'hide' }));
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
        ws.send(JSON.stringify({ type: 'waves', action: 'hide' }));
    }
}

// Move tools configuration to top level
const toolsConfig = {
    tools: [
        {
            type: "function",
            name: "get_orders",                        
            description: "Retrieves the number of orders",                                                
            parameters: {
                type: "object",
                properties: {},    
                required: []                        
            }
        },
        {
            type: "function",
            name: "change_fulfillment_status",
            description: "Changes the fulfillment status of an order",
            parameters: {
                type: "object",
                properties: {
                    orderId: {
                        type: "string",
                        description: "The ID of the order to update"
                    },
                    status: {
                        type: "string",
                        description: "The new fulfillment status",
                        enum: ["Pending", "Accepted", "Ready", "In_Delivery"]
                    }
                },
                required: ["orderId", "status"]
            }
        },
        {
            type: "function",
            name: "close_restaurant",
            description: "Closes the restaurant by closing all fulfillment options",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        },
        {
            type: "function",
            name: "open_restaurant",
            description: "Opens the restaurant by enabling all fulfillment options",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        },
        {
            type: "function",
            name: "set_item_out_of_stock",
            description: "Sets a menu item as out of stock by its name",
            parameters: {
                type: "object",
                properties: {
                    itemName: {
                        type: "string",
                        description: "The name of the menu item to set as out of stock"
                    }
                },
                required: ["itemName"]
            }
        }
    ],
    tool_choice: "auto"
};

wss.on('connection', async (ws) => {
    console.log(chalk.green('\n🔌 New client connected\n'));
    
    let audioChunks = [];
    let isCollectingAudio = false;
    
    const openAIWs = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
        headers: {
            "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
            "OpenAI-Beta": "realtime=v1",
        },
    });

    openAIWs.on("open", function open() {
        console.log("LEV -  OpenAI connected");
        console.log(chalk.green('\n🤖 Connected to OpenAI\n'));
        
        const initMessage = {
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                voice: "ash",
                instructions: getInstructions('Baruh'),
                tools: toolsConfig.tools,
                tool_choice: toolsConfig.tool_choice
            }
        };

        logMessage('outgoing', 'Initialize Session', initMessage);
        openAIWs.send(JSON.stringify(initMessage));
        
        ws.send(JSON.stringify({ type: 'status', content: 'connected' }));
    });

    openAIWs.on("message", function incoming(message) {
        
        try {
            const response = JSON.parse(message.toString());
            //logMessage('incoming', 'OpenAI Response', response);
            
            console.log("LEV -  Response type:", response.type);
            if (response.type === 'response.function_call_arguments.done') {

                console.log("LEV -  Handling function call...");

                (async () => {
                    try {
                        let result;
                        switch (response.name) {
                            case 'get_orders':
                                result = await handleGetOrders();
                                break;
                            case 'change_fulfillment_status':
                                const args = JSON.parse(response.arguments);
                                result = await handleChangeFulfillmentStatus(args.orderId, args.status);
                                break;
                            case 'close_restaurant':
                                result = await handleCloseRestaurant();
                                break;
                            case 'open_restaurant':
                                result = await handleOpenRestaurant();
                                break;
                            case 'set_item_out_of_stock':
                                const setStockArgs = JSON.parse(response.arguments);
                                result = await handleSetItemOutOfStock(setStockArgs.itemName);
                                break;
                        }

                        console.log('Function result:', result);

                        const functionResponse = {
                            type: 'conversation.item.create',
                            item: {
                                type: 'function_call_output',
                                call_id: response.call_id,
                                output: JSON.stringify(result)
                            }
                        };

                        console.log('Sending response:', JSON.stringify(functionResponse));

                        openAIWs.send(JSON.stringify(functionResponse));

                        const responseEvent = {
                            type: 'response.create'
                        };
                        openAIWs.send(JSON.stringify(responseEvent));
                    } catch (error) {
                        console.error('Error handling function call:', error);
                        const errorResponse = {
                            type: 'conversation.item.create',
                            item: {
                                type: 'function_call_output',
                                call_id: response.call_id,
                                output: JSON.stringify({ error: error.message })
                            }
                        };
                        openAIWs.send(JSON.stringify(errorResponse));
                    }
                })();
            }
            // Handle audio data
            else if (response.type === 'response.audio.delta') {
                if (response.delta) {
                    isCollectingAudio = true;
                    const audioBuffer = Buffer.from(response.delta, 'base64');
                    audioChunks.push(audioBuffer);
                    ws.send(JSON.stringify({ type: 'waves', action: 'show' }));
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
                    playCompleteAudio(audioChunks, ws);
                    audioChunks = [];
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
            console.log('Received message:', message.toString());
            
            let data;
            try {
                data = JSON.parse(message);
            } catch {
                // If parsing fails, treat it as a plain text message
                data = { type: 'text', content: message.toString() };
            }
            
            if (data.type === 'audio') {
                console.log('Received audio data');
                
                // Create uploads directory if it doesn't exist
                const uploadsDir = path.join(process.cwd(), 'uploads');
                if (!fs.existsSync(uploadsDir)){
                    fs.mkdirSync(uploadsDir);
                }
                
                // Decode base64 to buffer
                const audioBuffer = Buffer.from(data.data, 'base64');
                
                // Create filepath
                const filename = data.filename || `recording_${Date.now()}.wav`;
                const filepath = path.join(uploadsDir, filename);
                
                // Save file
                fs.writeFileSync(filepath, audioBuffer);
                console.log(`Audio saved to: ${filepath}`);

                // Send confirmation to client
                ws.send(JSON.stringify({
                    type: 'status',
                    content: `Audio saved as ${filename}`
                }));

                // Convert audio to the required format using ffmpeg
                const outputPath = path.join(uploadsDir, `converted_${filename}`);
                
                await new Promise((resolve, reject) => {
                    ffmpeg(filepath)
                        .toFormat('wav')
                        .audioChannels(1)
                        .audioFrequency(24000)
                        .on('end', resolve)
                        .on('error', reject)
                        .save(outputPath);
                });

                // Read the converted file and send to OpenAI
                const audioData = fs.readFileSync(outputPath);
                const base64AudioData = audioData.slice(44).toString('base64');  // Skip WAV header

                // Clean up temporary files
                fs.unlinkSync(outputPath);

                // Continue with OpenAI processing
                const audioEvent = {
                    type: 'conversation.item.create',
                    item: {
                        type: 'message',
                        role: 'user',
                        content: [
                            {
                                type: 'input_audio',
                                audio: base64AudioData
                            }
                        ]
                    }
                };

                logMessage('outgoing', 'Send Audio', audioEvent);
                openAIWs.send(JSON.stringify(audioEvent));
                
                // Send response.create event
                const responseEvent = {
                    type: 'response.create'
                };
                openAIWs.send(JSON.stringify(responseEvent));

            } else {
                const userMessage = data.type === 'text' ? data.content : data.toString();
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
                    response: {}
                };
                openAIWs.send(JSON.stringify(responseEvent));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Error processing message'
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
/*
 * @file Discord Hang Status main execution file
 * @author mistine
 */

const fs = require('fs');
const WebSocket = require('ws');
const updateActivityInterval = 15_000;
const gateway = 'wss://gateway.discord.gg/?v=9&encoding=json';
let ws;
let heartbeatInterval = null;
let sessionId = null;
let lastSequence = null;
let resumeGatewayUrl = null;
let config = {};

const loadConfig = () => {
    try {
        config = JSON.parse(fs.readFileSync('./config.json'));
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

function heartbeat(ws) {
    const heartbeatPayload = {
        op: 1,
        d: lastSequence
    };
    ws.send(JSON.stringify(heartbeatPayload));
}

function resume(ws) {
    const payload = {
        op: 6,
        d: {
            token: config.token,
            session_id: sessionId,
            seq: lastSequence
        }
    };
    ws.send(JSON.stringify(payload));
}

function identify(ws) {
    const payload = {
        op: 2,
        d: {
            token: config.token,
            intents: 0,
            properties: {
                $os: 'Windows',
                $browser: 'Discord Client',
                $device: 'Discord Client'
            }
        }
    };
    ws.send(JSON.stringify(payload));
}

function updateActivity(ws) {
    const activityPayload = {
        op: 3,
        d: {
            since: null,
            activities: [{
                name: "Hang Status",
                type: 6,
                state: "custom",
                details: config.details,
                emoji: config.emoji,
            }],
            status: "invisible",
            afk: false,
			broadcast: null
        }
    };
    ws.send(JSON.stringify(activityPayload));
}

function joinVoiceChannel(ws, guildId, channelId) {
    const payload = {
        op: 4,
        d: {
            guild_id: guildId,
            channel_id: channelId,
            self_mute: true,
            self_deaf: true
        }
    };
    ws.send(JSON.stringify(payload));
}

function connect() {
    ws = new WebSocket(!!resumeGatewayUrl ? resumeGatewayUrl : gateway);
    resumeGatewayUrl = null; // Reset this immediately so we don't try it again when it fails

    ws.on('open', () => {
        console.log('Connected to Discord Gateway');
        loadConfig();
        if (sessionId) {
            console.log(`Attempting to resume session ${sessionId}...`)
            resume(ws);
        } else {
            identify(ws);
        }
    });

    ws.on('message', (message) => {
        const response = JSON.parse(message);
        lastSequence = response.s || lastSequence; // Update the sequence number
        console.log(`Received msg opcode = ${response.op}, sequence = ${response.s}`);
        switch (response.op) {
            case 1: // Heartbeat request
                heartbeat(ws); // Send one immediately
                break;
            case 10: // Hello
                heartbeatInterval = setInterval(() => heartbeat(ws), response.d.heartbeat_interval);
                setTimeout(() => heartbeat(ws), response.d.heartbeat_interval * Math.random());
                break;
            case 9: // Invalid session
                console.log('Invalid session, reidentifying...');
                sessionId = null;
                identify(ws);
                break;
            case 0: // Dispatch
                if (response.t === 'READY') {
                    resumeGatewayUrl = response.d.resume_gateway_url;
                    sessionId = response.d.session_id;
                    console.log(`Dispatched READY, user ${response.d.user.username}`);
                    if (config.server_id && config.voice_channel_id) {
                        joinVoiceChannel(ws, config.server_id, config.voice_channel_id);
                    }
                    updateActivity(ws);
                }
                if (response.t === 'RESUMED') {
                    console.log(`Successfully resumed session ${response.d.session_id}`);
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log('Disconnected from Discord Gateway');
        clearInterval(heartbeatInterval);
        setTimeout(connect, 5000); // Reconnect after a delay
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
}

connect();
setInterval(() => {
    loadConfig();
    updateActivity(ws);
}, updateActivityInterval);
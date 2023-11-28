/*
 * @file Discord Hang Status main execution file
 * @author mistine
 */

const fs = require('fs');
const WebSocket = require('ws');
const updateActivityInterval = 15_000;
const gateway = 'wss://gateway.discord.gg/?v=9&encoding=json';
let heartbeatInterval = null;
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
        d: null
    };
    ws.send(JSON.stringify(heartbeatPayload));
}

function identify(ws) {
    loadConfig();
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
    loadConfig();
    const activityPayload = {
        op: 3,
        d: {
            since: null,
            activities: [{
                name: "Hang Status",
                type: 6,
                state: "custom",
                details: config.details,
                emoji: config.emoji
            }],
            status: "offline", // Apparently offline works...?
            afk: false
        }
    };
    ws.send(JSON.stringify(activityPayload));
}

const ws = new WebSocket(gateway);

ws.on('open', () => {
    console.log('Connected to Discord Gateway');
    identify(ws);
});

ws.on('message', (message) => {
    const response = JSON.parse(message);
    switch (response.op) {
        case 10:
            heartbeatInterval = setInterval(() => heartbeat(ws), response.d.heartbeat_interval);
            updateActivity(ws);
            break;
    }
});

ws.on('close', () => {
    console.log('Disconnected from Discord Gateway');
    clearInterval(heartbeatInterval);
});

setTimeout(() => {
    updateActivity(ws);
}, updateActivityInterval);
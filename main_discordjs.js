/*
 * @file Sets hang status using a modified discord.js library
 * @author mistine
 */

const fs = require('fs');
const { Client } = require('discord.js-selfbot-v13');
const client = new Client({
    checkUpdate: false
});
const updateActivityInterval = 15_000;
let config = {};

const loadConfig = () => {
    try {
        config = JSON.parse(fs.readFileSync('./config.json'));
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

const setHangStatus = () => {
    client.user.setPresence({
        activities: [{
            name: 'Hang Status',
            type: 6, // undocumented, apparently reserved for hang status?
            state: 'custom',
            details: config.details,
            emoji: config.emoji
        }],
        status: 'invisible',
        afk: false
    });
}

loadConfig();
client.login(config.token);
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    setHangStatus();
    setInterval(() => {
        loadConfig();
        setHangStatus();
    }, updateActivityInterval);
});

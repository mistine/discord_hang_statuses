# Discord Hang Statuses

Standalone NodeJS script that allows you to set **Hang Status**, an experimental feature on Discord, without ever joining a voice channel.

![Example](https://i.imgur.com/ZF1TQdR.png)

Currently, only `custom` (supply your own text and emoji) hang statuses are supported. 

## WARNING

This is an **EXPERIMENTAL** and **UNDOCUMENTED** feature on Discord as of now. Things may break. **Use at your own risk.**

## Usage

1. Clone the repository
2. `npm i`
3. Create & edit `config.json` file accordingly:
```
{
    "token": "", // Your Discord token
    "details": "", // Text that is shown after "Right now, I'm just -"
    "emoji": {
        "id": "", // Emoji ID
        "name": "", // Emoji name
        "animated": false // Whether the emoji is animated or not
    },
    "server_id": "",
    "voice_channel_id": ""
}
```
4. `node main.js`

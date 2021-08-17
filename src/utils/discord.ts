import { Client, Intents } from 'discord.js';

import log from './log';
import { logHeader } from './logExtra';

const client: Client = new Client({
    intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILDS
    ]
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.on(`ready`, async () => {
    logHeader(() => {
        log(`green`, `Succesfully connected to Discord.`);
        logHeader();
    });
});

export default client;

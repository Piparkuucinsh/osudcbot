import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import { readdirSync } from "fs";

import dotenv from 'dotenv';

dotenv.config();

const ROOT_PATH = path.join(__dirname, '..');

export const init_dc_client = () => {

    const discordClient = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
        ],
    });

    discordClient.login(process.env.BOT_TOKEN);

    try {
        const eventsPath = path.join(ROOT_PATH, 'events');
        const eventsFiles = readdirSync(eventsPath).filter((file) =>
            file.endsWith(".ts")
        );

        for (const file of eventsFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            if (event.once) {
                discordClient.once(event.name, (...args) => event.execute(...args));
            } else {
                discordClient.on(event.name, (...args) => event.execute(...args));
            }
        }
    } catch (error) {
        console.error("Failed to set up Discord client events:", error);
    }

    return discordClient;
}
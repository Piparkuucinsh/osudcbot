import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import { readdirSync } from "fs";

import dotenv from 'dotenv';

dotenv.config();

const ROOT_PATH = path.join(__dirname, '..');

class DiscordController {
    private discordClient: Client;

    public constructor() {
        this.discordClient = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
            ],
        });
    }

    public login(): void {
        try {
            this.discordClient.login(process.env.BOT_TOKEN);
        } catch (error) {
            console.error("Failed to log in to Discord:", error);
        }
    }

    public setEvents(): void {
        try {
            const eventsPath = path.join(ROOT_PATH, 'events');
            const eventsFiles = readdirSync(eventsPath).filter((file) =>
                file.endsWith(".ts")
            );

            for (const file of eventsFiles) {
                const filePath = path.join(eventsPath, file);
                const event = require(filePath);
                if (event.once) {
                    this.discordClient.once(event.name, (...args) => event.execute(...args));
                } else {
                    this.discordClient.on(event.name, (...args) => event.execute(...args));
                }
            }
        } catch (error) {
            console.error("Failed to set up Discord client events:", error);
        }
    }
}

export let discordClient = new DiscordController();
import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import "dotenv/config";
import { readdirSync } from "fs";
import dotenv from 'dotenv';
import { discordClient } from "./discordController";
import { osuClient } from "./osuController";

dotenv.config();

const ROOT_PATH = path.join(__dirname, '..');

class BotController {

    public constructor() {
    }

    public setup(): void {
        try {
            discordClient.setEvents();
            discordClient.login();
        } catch (error) {
            console.error("Failed to set up bot:", error);
        }
    }
}

export let bot = new BotController();
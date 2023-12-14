import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import "dotenv/config";
import { readdirSync } from "fs";
import dotenv from 'dotenv';
import DiscordController from "./discordController";
import OsuController from "./osuController";

dotenv.config();

export default class botController {
    private static instance: botController;
    private discordClient: DiscordController;
    private osuClient: OsuController;

    private constructor() {
        this.discordClient = DiscordController.getInstance();
        this.osuClient = OsuController.getInstance();
    }

    public static getInstance(): botController {
        if (!botController.instance) {
            botController.instance = new botController();
        }

        return botController.instance;
    }

    public setup(): void {
        try {
            this.discordClient.setEvents();
            this.discordClient.login();
        } catch (error) {
            console.error("Failed to set up bot:", error);
        }
    }
}
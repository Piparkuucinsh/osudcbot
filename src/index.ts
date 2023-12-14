import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import "dotenv/config";
import { readdirSync } from "fs";

import botController from "./controllers/botController";

var bot: botController = botController.getInstance();
bot.setup();

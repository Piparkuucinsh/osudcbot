import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import "dotenv/config";
import { readdirSync } from "fs"

import { bot } from "./controllers/botController";

bot.setup();

import { Client, Events } from "discord.js";
import OsuController from "../controllers/osuController";

var osuClient = OsuController.getInstance();

module.exports = {
  name: Events.ClientReady,
  once: false,
  execute: async (c: Client<true>) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    osuClient.login();
  },
};

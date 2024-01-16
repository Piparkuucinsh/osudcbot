import { Client, Events } from "discord.js";

module.exports = {
  name: Events.ClientReady,
  once: false,
  execute: async (c: Client<true>) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  },
};

import { Client, Events } from "discord.js";
import { EventModule } from "types";
import { refreshToken } from "../utils/refreshToken";

const ReadyEventModule: EventModule<Events.ClientReady> = {
  name: Events.ClientReady,
  once: false,
  execute: (c: Client<true>) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    console.log("Connected to the following guilds:");
    c.guilds.cache.forEach(guild => {
      console.log(`- ${guild.name} (ID: ${guild.id})`);
    });
    const tokenResetInterval = 10 * 1000;// 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    // setInterval(async () => {
    //   try {
    //     await refreshToken();
    //     console.log('Token refreshed successfully');
    //   } catch (error) {
    //     console.error('Error refreshing token:', error);
    //   }
    // }, tokenResetInterval);
  },
};

export default ReadyEventModule;

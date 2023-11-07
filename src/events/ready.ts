import { Client, Events } from "discord.js";
import { auth } from "osu-api-extended";

module.exports = {
  name: Events.ClientReady,
  once: false,
  execute: async (c: Client<true>) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    if (process.env.OSU_CLIENT_ID && process.env.OSU_CLIENT_SECRET) {
      await auth.login(
        Number(process.env.OSU_CLIENT_ID),
        process.env.OSU_CLIENT_SECRET,
        ["public"]
      );
    } else {
      throw new Error("Missing osu api credentials in env");
    }
  },
};

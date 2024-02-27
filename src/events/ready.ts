import { Client, Events } from "discord.js";
import { refreshRoles } from "func/refreshRoles";
import { EventModule } from "types";

const ReadyEventModule: EventModule<Events.ClientReady> = {
  name: Events.ClientReady,
  once: false,
  execute: (c: Client<true>) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    refreshRoles()
      .then(() => {})
      .catch((error: Error) => {
        throw error;
      });
  },
};

export default ReadyEventModule;

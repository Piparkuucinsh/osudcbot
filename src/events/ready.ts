import { Client, Events } from "discord.js";
import { EventModule } from "types";

const ReadyEventModule: EventModule<Events.ClientReady> = {
    name: Events.ClientReady,
    once: false,
    execute: (c: Client<true>) => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    },
};

export default ReadyEventModule;

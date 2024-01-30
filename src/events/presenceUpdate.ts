import { Events, Presence } from "discord.js";
import { config } from "../config";
import { EventModule } from "types";

const presenceUpdateEvent: EventModule<Events.PresenceUpdate> = {
  name: Events.PresenceUpdate,
  once: false,
  execute: (_oldPresence: Presence | null, newPresence: Presence) => {
    try {
      console.log(newPresence);
      if (!newPresence.guild) {
        return;
      }
      if (newPresence.guild.id != config.server_id) {
        return;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

export default presenceUpdateEvent;

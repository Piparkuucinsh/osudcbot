import { Events, Presence } from "discord.js";
import { config } from "../config";

module.exports = {
  name: Events.PresenceUpdate,
  once: false,
  execute(presence: Presence) {
    console.log(presence);
	if (!presence.guild) {
		return
	}
	if (presence.guild.id != config.server_id) {
		return
	}

	console.log(presence.guild.id)
  },
};

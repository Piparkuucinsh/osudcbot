import { Events, Presence } from "discord.js"; 

module.exports = {
	name: Events.PresenceUpdate,
	once: false,
	execute(presence: Presence) {
        console.log(presence.status)
	},
};
import { Events, type Presence } from "discord.js";
import { linkAccounts } from "@/features/linkAccounts";
import { config } from "@/init/config";
import { error, info } from "@/lib/log";
import type { EventModule } from "@/types";

const presenceUpdateEvent: EventModule<Events.PresenceUpdate> = {
	name: Events.PresenceUpdate,
	once: false,
	execute: (_oldPresence: Presence | null, newPresence: Presence) => {
		try {
			// console.log(newPresence);
			if (!newPresence.guild) {
				return;
			}
			info(`Presence update guild id: ${newPresence.guild.id}`);
			info(`Config server id: ${config.discord.serverId}`);
			if (newPresence.guild.id !== config.discord.serverId) {
				return;
			}
			info("Linking accounts...");
			void linkAccounts(newPresence);
		} catch (err) {
			error(String(err));
		}
	},
};

export default presenceUpdateEvent;

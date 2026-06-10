import { Events, type Presence } from "discord.js";
import { linkAccounts } from "@/features/linkAccounts";
import { config } from "@/init/config";
import { error } from "@/lib/log";
import type { EventModule } from "@/types";

const presenceUpdateEvent: EventModule<Events.PresenceUpdate> = {
	name: Events.PresenceUpdate,
	once: false,
	execute: (_oldPresence: Presence | null, newPresence: Presence) => {
		try {
			if (!newPresence.guild) {
				return;
			}
			if (newPresence.guild.id !== config.discord.serverId) {
				return;
			}
			void linkAccounts(newPresence);
		} catch (err) {
			error(String(err));
		}
	},
};

export default presenceUpdateEvent;

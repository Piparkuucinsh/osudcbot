import { type Client, Events } from "discord.js";
import { refreshRoles, startRoleRefreshLoop } from "@/features/roleRefresh";
import { runUserBestLoop, startUserBestLoop } from "@/features/userBest";
import { config } from "@/init/config";
import { createPlayer, listAllPlayers } from "@/lib/db";
import { info, warn } from "@/lib/log";
import type { EventModule } from "@/types";

const ReadyEventModule: EventModule<Events.ClientReady> = {
	name: Events.ClientReady,
	once: false,
	execute: (c: Client<true>) => {
		info(`Ready! Logged in as ${c.user.tag}`);
		warn("Bot ready");
		refreshRoles()
			.then(() => {})
			.catch((error: Error) => {
				throw error;
			});
		startRoleRefreshLoop();
		runUserBestLoop()
			.then(() => {})
			.catch((error: Error) => {
				throw error;
			});
		startUserBestLoop();
		backfillDatabase(c)
			.then(() => {})
			.catch((error: Error) => {
				throw error;
			});
	},
};

const backfillDatabase = async (client: Client<true>): Promise<void> => {
	const guild = await client.guilds.fetch(config.discord.serverId);
	const members = await guild.members.fetch();
	const existing = new Set(await listAllPlayers());
	for (const member of members.values()) {
		if (!existing.has(member.id)) {
			await createPlayer(member.id);
			warn(
				`update_user: User ${member.displayName} (ID: ${member.id}) was not in database and has been added`,
			);
		}
	}
};

export default ReadyEventModule;

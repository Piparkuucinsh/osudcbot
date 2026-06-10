import { SlashCommandBuilder } from "discord.js";
import { listLinkedPlayers } from "@/lib/db";
import {
	maybeDeferReply,
	maybeEditReply,
	maybeRemoveRole,
	maybeReply,
} from "@/lib/dryRun";
import { requireAdmin } from "@/lib/permissions";
import { getRankRoleIds } from "@/lib/roles";
import type { CommandModule } from "@/types";

const purgeRoles: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("purge_roles")
		.setDescription(
			"Purge discord roles from players that aren't linked in the database",
		),
	execute: async (interaction) => {
		if (!requireAdmin(interaction)) {
			await maybeReply(interaction, {
				content: "You don't have permission to use this command.",
				ephemeral: true,
			});
			return;
		}

		await maybeDeferReply(interaction);

		const guild = interaction.guild;
		if (!guild) {
			await maybeEditReply(interaction, "Error: Guild not found.");
			return;
		}

		const linked = new Set(
			(await listLinkedPlayers()).map((row) => row.discord_id),
		);
		const rankRoleIds = new Set(getRankRoleIds());
		let purged = 0;

		const members = await guild.members.fetch();
		for (const member of members.values()) {
			if (linked.has(member.id)) continue;
			const rolesToRemove = member.roles.cache.filter((role) =>
				rankRoleIds.has(role.id),
			);
			if (rolesToRemove.size > 0) {
				await maybeRemoveRole(member, rolesToRemove, "/purge_roles command");
				purged += 1;
			}
		}

		await maybeEditReply(interaction, `Purged roles for ${purged} member(s).`);
	},
};

export default purgeRoles;

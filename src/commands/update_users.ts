import { SlashCommandBuilder } from "discord.js";
import { config } from "@/init/config";
import { createPlayer, listAllPlayers } from "@/lib/db";
import { maybeDeferReply, maybeEditReply, maybeReply } from "@/lib/dryRun";
import { requireAdmin } from "@/lib/permissions";
import type { CommandModule } from "@/types";

const updateUsers: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("update_user")
		.setDescription("Update users in database (bot channel only)"),
	execute: async (interaction) => {
		if (!requireAdmin(interaction)) {
			await maybeReply(interaction, {
				content: "You don't have permission to use this command.",
				ephemeral: true,
			});
			return;
		}

		if (interaction.channelId !== config.discord.botChannelId) {
			await maybeReply(interaction, {
				content: "This command can only be used in the bot channel.",
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

		const members = await guild.members.fetch();
		const existing = new Set(await listAllPlayers());
		const added: string[] = [];

		for (const member of members.values()) {
			if (!existing.has(member.id)) {
				await createPlayer(member.id);
				added.push(member.displayName);
			}
		}

		if (added.length > 0) {
			await maybeEditReply(
				interaction,
				`Pievienoja ${added.join(", ")} datubāzei.`,
			);
		} else {
			await maybeEditReply(interaction, "Nevienu nepievienoja datubāzei.");
		}
	},
};

export default updateUsers;

import { SlashCommandBuilder } from "discord.js";
import { config } from "@/init/config";
import { maybeReply } from "@/lib/dryRun";
import { requireAdmin } from "@/lib/permissions";
import type { CommandModule } from "@/types";

const check: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("check")
		.setDescription("Echo a message (bot channel only)")
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("The message to echo")
				.setRequired(true),
		),
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

		const message = interaction.options.getString("message", true);
		await maybeReply(interaction, message);
	},
};

export default check;

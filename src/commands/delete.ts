import { SlashCommandBuilder } from "discord.js";
import { config } from "@/init/config";
import { requireAdmin } from "@/lib/permissions";
import type { CommandModule } from "@/types";

const deleteMessages: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("delete")
		.setDescription("Delete bot messages from botspam channel")
		.addIntegerOption((option) =>
			option
				.setName("limit")
				.setDescription("Number of messages to check (default: 20)")
				.setRequired(false),
		),
	execute: async (interaction) => {
		if (!requireAdmin(interaction)) {
			await interaction.reply({
				content: "You don't have permission to use this command.",
				ephemeral: true,
			});
			return;
		}

		const channel = await interaction.guild?.channels.fetch(
			config.discord.botSpamChannelId,
		);
		if (!channel || !("messages" in channel)) {
			await interaction.reply({
				content: "Target channel not found.",
				ephemeral: true,
			});
			return;
		}

		const limit = interaction.options.getInteger("limit") ?? 20;
		await interaction.deferReply();

		let deleted = 0;
		const messages = await channel.messages.fetch({ limit });
		for (const message of messages.values()) {
			if (message.author.id === interaction.client.user?.id) {
				try {
					await message.delete();
					deleted += 1;
				} catch {
					// ignore delete errors
				}
			}
		}

		await interaction.editReply(`Deleted ${deleted} messages.`);
	},
};

export default deleteMessages;

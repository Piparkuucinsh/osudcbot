import { SlashCommandBuilder } from "discord.js";
import { config } from "@/init/config";
import {
	maybeDeferReply,
	maybeDeleteMessage,
	maybeEditReply,
	maybeReply,
} from "@/lib/dryRun";
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
			await maybeReply(interaction, {
				content: "You don't have permission to use this command.",
				ephemeral: true,
			});
			return;
		}

		const channel = await interaction.guild?.channels.fetch(
			config.discord.botSpamChannelId,
		);
		if (!channel || !("messages" in channel)) {
			await maybeReply(interaction, {
				content: "Target channel not found.",
				ephemeral: true,
			});
			return;
		}

		const limit = interaction.options.getInteger("limit") ?? 20;
		await maybeDeferReply(interaction);

		let deleted = 0;
		const messages = await channel.messages.fetch({ limit });
		for (const message of messages.values()) {
			if (message.author.id === interaction.client.user?.id) {
				try {
					if (await maybeDeleteMessage(message)) {
						deleted += 1;
					}
				} catch {
					// ignore delete errors
				}
			}
		}

		await maybeEditReply(interaction, `Deleted ${deleted} messages.`);
	},
};

export default deleteMessages;

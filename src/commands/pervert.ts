import { SlashCommandBuilder } from "discord.js";
import { config } from "@/init/config";
import type { CommandModule } from "@/types";

const pervert: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("pervert")
		.setDescription("Add pervert role to yourself"),
	execute: async (interaction) => {
		if (!interaction.guild) {
			await interaction.reply({
				content: "This command can only be used in a server.",
				ephemeral: true,
			});
			return;
		}

		const role = interaction.guild.roles.cache.get(config.roles.pervert);
		if (!role) {
			await interaction.reply({
				content: "Role not found.",
				ephemeral: true,
			});
			return;
		}

		const member = interaction.guild.members.cache.get(interaction.user.id);
		if (!member) {
			await interaction.reply({
				content: "Could not find member in guild.",
				ephemeral: true,
			});
			return;
		}

		await member.roles.add(role);
		await interaction.reply(`Added role to ${member.displayName}`);
	},
};

export default pervert;

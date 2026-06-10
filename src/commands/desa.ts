import { SlashCommandBuilder } from "discord.js";
import { maybeReply } from "@/lib/dryRun";
import type { CommandModule } from "@/types";

const desa: CommandModule = {
	data: new SlashCommandBuilder().setName("desa").setDescription("desa"),
	execute: async (interaction) => {
		await maybeReply(interaction, "<:desa:272418900111785985>");
	},
};

export default desa;

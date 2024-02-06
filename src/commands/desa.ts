import { config } from "config";
import { SlashCommandBuilder } from "discord.js";
import { CommandModule } from "types";

const desa: CommandModule = {
  data: new SlashCommandBuilder().setName("desa").setDescription("desa"),
  execute: async (interaction) => {
    await interaction.reply(config.desa ?? "desa");
  },
};

export default desa;

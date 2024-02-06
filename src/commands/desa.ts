import { SlashCommandBuilder } from "discord.js";
import { CommandModule } from "types";

const desa: CommandModule = {
  data: new SlashCommandBuilder().setName("desa").setDescription("desa"),
  execute: async (interaction) => {
    await interaction.reply("prikols");
  },
};

export default desa;

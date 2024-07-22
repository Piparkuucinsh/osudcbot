import { config } from '@/config.ts'
import { SlashCommandBuilder } from 'discord.js'
import type { CommandModule } from '@/types.d.ts'

const desa: CommandModule = {
    data: new SlashCommandBuilder().setName('desa').setDescription('desa'),
    execute: async (interaction) => {
        await interaction.reply(config.desa ?? 'desa')
    },
}

export default desa

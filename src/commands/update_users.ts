import { SlashCommandBuilder } from 'discord.js'
import { CommandModule } from '@/types'
import { config } from '@/init/config'
import { requireAdmin } from '@/lib/permissions'
import { listAllPlayers, createPlayer } from '@/lib/db'

const updateUsers: CommandModule = {
    data: new SlashCommandBuilder()
        .setName('update_user')
        .setDescription('Update users in database (bot channel only)'),
    execute: async (interaction) => {
        if (!requireAdmin(interaction)) {
            await interaction.reply({
                content: "You don't have permission to use this command.",
                ephemeral: true,
            })
            return
        }

        if (interaction.channelId !== config.discord.botChannelId) {
            await interaction.reply({
                content: 'This command can only be used in the bot channel.',
                ephemeral: true,
            })
            return
        }

        await interaction.deferReply()

        const guild = interaction.guild
        if (!guild) {
            await interaction.editReply('Error: Guild not found.')
            return
        }

        const members = await guild.members.fetch()
        const existing = new Set(await listAllPlayers())
        const added: string[] = []

        for (const member of members.values()) {
            if (!existing.has(member.id)) {
                await createPlayer(member.id)
                added.push(member.displayName)
            }
        }

        if (added.length > 0) {
            await interaction.editReply(
                `Pievienoja ${added.join(', ')} datubāzei.`
            )
        } else {
            await interaction.editReply('Nevienu nepievienoja datubāzei.')
        }
    },
}

export default updateUsers

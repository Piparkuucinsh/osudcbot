import { SlashCommandBuilder } from 'discord.js'
import { CommandModule } from '@/types'
import { requireAdmin } from '@/lib/permissions'
import { listLinkedPlayers } from '@/lib/db'
import { getRankRoleIds } from '@/lib/roles'

const purgeRoles: CommandModule = {
    data: new SlashCommandBuilder()
        .setName('purge_roles')
        .setDescription(
            "Purge discord roles from players that aren't linked in the database"
        ),
    execute: async (interaction) => {
        if (!requireAdmin(interaction)) {
            await interaction.reply({
                content: "You don't have permission to use this command.",
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

        const linked = new Set(
            (await listLinkedPlayers()).map((row) => row.discord_id)
        )
        const rankRoleIds = new Set(getRankRoleIds())
        let purged = 0

        const members = await guild.members.fetch()
        for (const member of members.values()) {
            if (linked.has(member.id)) continue
            const rolesToRemove = member.roles.cache.filter((role) =>
                rankRoleIds.has(role.id)
            )
            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove)
                purged += 1
            }
        }

        await interaction.editReply(`Purged roles for ${purged} member(s).`)
    },
}

export default purgeRoles

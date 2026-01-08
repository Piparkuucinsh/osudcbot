import type { CommandInteraction, GuildMember } from 'discord.js'
import { config } from '@/init/config'

export const isAdmin = (member: GuildMember): boolean => {
    if (member.permissions.has('Administrator')) return true
    return member.roles.cache.has(config.roles.admin)
}

export const requireAdmin = (interaction: CommandInteraction): boolean => {
    const member = interaction.member
    if (!member || !('permissions' in member)) return false
    return isAdmin(member as GuildMember)
}

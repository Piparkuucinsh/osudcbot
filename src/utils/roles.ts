import { guild } from '..'
import { config } from '@/config'

// Function to get the corresponding role ID based on rank.
export const getRoleIdWithRank = (rank: number): string => {
    if (rank > config.roles[0].threshold) return config.roles[0].roleId

    const role = config.roles.find(({ threshold }) => rank <= threshold)
    return role ? role.roleId : ''
}

export const getCurrentRoleIds = async (
    discordUserId: string
): Promise<string[] | null> => {
    try {
        const member = await guild.members.fetch(discordUserId)
        const roles = member.roles.cache.map((role) => role.id)

        const matchingRole = roles.filter((roleId) =>
            config.roles.some((role) => role.roleId === roleId)
        )

        return matchingRole.length === 0 ? null : matchingRole
    } catch (error) {
        console.error('Error fetching member or roles:', error)
        return null
    }
}

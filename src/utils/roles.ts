import { guild } from '../index.ts'
import { config } from '@/config.ts'

// Function to get the corresponding role ID based on rank.
export const getRoleIdWithRank = (rank: number): string => {
    if (rank > config.roles.rank_roles[0].threshold)
        return config.roles.outside_range.id

    const role = config.roles.rank_roles.find(
        ({ threshold }) => rank <= threshold
    )
    return role ? role.id : ''
}

export const getCurrentRoleIds = async (
    discordUserId: string
): Promise<string[] | null> => {
    try {
        const member = await guild.members.fetch(discordUserId)
        const roles = member.roles.cache.map((role) => role.id)

        const allRoles = [
            ...config.roles.rank_roles,
            config.roles.restricted,
            config.roles.outside_country,
            config.roles.outside_range,
        ]

        const matchingRole = roles.filter((roleId) =>
            allRoles.some((role) => role.id === roleId)
        )

        return matchingRole.length === 0 ? null : matchingRole
    } catch (error) {
        console.error('Error fetching member or roles:', error)
        return null
    }
}

import { config, RankRoleConfig, RankRoleKey } from '@/init/config'

export const getSortedRankRoles = (): Array<[RankRoleKey, RankRoleConfig]> => {
    const entries = Object.entries(config.rankRoles) as Array<
        [RankRoleKey, RankRoleConfig]
    >
    entries.sort((a, b) => a[1].threshold - b[1].threshold)
    return entries
}

export const getRankRoleByRank = (rank: number): RankRoleKey => {
    const entries = getSortedRankRoles()
    for (const [key, role] of entries) {
        if (rank <= role.threshold) return key
    }
    return entries[entries.length - 1][0]
}

export const getRankRoleThreshold = (key: RankRoleKey): number => {
    return config.rankRoles[key].threshold
}

export const getRankRoleIds = (): string[] => {
    return Object.values(config.rankRoles).map((role) => role.id)
}

export const getRankRoleKeyForMember = (
    roleIds: string[]
): RankRoleKey | null => {
    for (const [key, role] of Object.entries(config.rankRoles) as Array<
        [RankRoleKey, RankRoleConfig]
    >) {
        if (roleIds.includes(role.id)) {
            return key
        }
    }
    return null
}

export interface StatisticalProperties {
    pp_score?: number
    accuracy?: number
    play_count?: number
    total_score?: number
    ranked_score?: number
    level?: number
    global_rank?: number
    country_rank?: number
    highest_rank?: number
}

export interface UserStatistics {
    username: string
    lastActivity?: string
    stats: StatisticalProperties
}

export interface Stat {
    username: string
    last_updated: string
    stat_value: number
}

export interface MapPlayCount {
    beatmapId: bigint
    beatmapName: string
    playCount: number
    beatmapCover?: string
}

export interface Achievement {
    beatmapId: bigint
    beatmapName: string
    username: string
    playCount: number
    rank: number
    percentile: number
    profilePicture: string
}

export enum Demographic {
    Users = 'users',
    Roles = 'roles',
    All = 'all',
}
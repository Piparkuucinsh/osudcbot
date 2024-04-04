import {
    ClientEvents,
    CommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'

export type EventModule<K extends keyof ClientEvents> = {
    name: K
    once: boolean
    execute: (...args: ClientEvents[K]) => void
}

export type CommandModule = {
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    execute: (interaction: CommandInteraction) => Promise<void>
}

export interface Role {
    id: string
    name: string
}

export interface RankRole extends Role {
    threshold: number
}

export type Roles = {
    rank_roles: RankRole[]
    restricted: Role
    outside_country: Role
    outside_range: Role
}

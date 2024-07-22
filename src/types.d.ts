import {
    ClientEvents,
    CommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'

type EventHandler<E extends keyof ClientEvents> = (
    ...args: ClientEvents[E]
) => Promise<void> | void

export type EventModule<K extends keyof ClientEvents> = {
    name: K
    once: boolean
    execute: EventHandler<K>
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

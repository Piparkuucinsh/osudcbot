import {
    ChannelType,
    GuildMember,
    MessageCreateOptions,
    Role,
} from 'discord.js'
import { client, guild } from '@/index'
import { config } from '@/init/config'

export const getGuildMember = async (
    discordId: string
): Promise<GuildMember | null> => {
    try {
        const member =
            guild.members.cache.get(discordId) ??
            (await guild.members.fetch(discordId))
        return member ?? null
    } catch {
        return null
    }
}

export const getRole = async (roleId: string): Promise<Role | null> => {
    try {
        const role =
            guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId))
        return role ?? null
    } catch {
        return null
    }
}

export const sendBotChannel = async (
    message: string | MessageCreateOptions
): Promise<void> => {
    const channel = await client.channels.fetch(config.discord.botChannelId)
    if (channel && channel.type === ChannelType.GuildText) {
        await channel.send(message)
    }
}

export const sendBotSpam = async (
    message: string | MessageCreateOptions
): Promise<void> => {
    const channel = await client.channels.fetch(config.discord.botSpamChannelId)
    if (channel && channel.type === ChannelType.GuildText) {
        await channel.send(message)
    }
}

export const sendNotifications = async (
    message: string | MessageCreateOptions
): Promise<void> => {
    const channel = await client.channels.fetch(
        config.discord.notificationsChannelId
    )
    if (channel && channel.type === ChannelType.GuildText) {
        await channel.send(message)
    }
}

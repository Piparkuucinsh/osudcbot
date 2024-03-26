import { SlashCommandBuilder, CommandInteraction, User } from 'discord.js'
import { CommandModule } from 'types'
import { prisma } from '../lib/prisma'

interface UserStatistics {
    username: string
    lastActivity?: string
    pp_score?: string
    accuracy?: string
    play_count?: string
    total_score?: string
    ranked_score?: string
    level?: string
    global_rank?: string
    country_rank?: string
    highest_rank?: string
}

type EmbedField = {
    name: string
    value: string
    inline: boolean
}

type Embed = {
    color: number
    title: string
    fields: EmbedField[]
    footer?: {
        text: string
    }
}

const viewUser: CommandModule = {
    data: new SlashCommandBuilder()
        .setName('view_user')
        .setDescription('Views the statistics of a user')
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription('The username of the user to view')
                .setRequired(true)
        ),

    execute: async (interaction: CommandInteraction) => {
        try {
            console.log('Viewing user statistics')
            const username = getUsername(interaction)
            console.log(username)
            const statistics = await collectStatistics(username)
            console.log(statistics)
            const statistics_embed = embedStatistics(statistics)
            await interaction.reply({ embeds: [statistics_embed] })
        } catch (error) {
            console.error('Error in viewUserCommand:', error)
            let errorMessage = 'Failed to do something exceptional'
            if (error instanceof Error) {
                errorMessage = error.message
            }
            await interaction.reply(errorMessage)
        }
    },
}

function getUsername(interaction: CommandInteraction): string {
    const usernameOption = interaction.options.data.find(
        (opt) => opt.name === 'username'
    )
    const username = usernameOption?.value as string | undefined
    if (!username) {
        throw new Error('Please provide a username to view the user.')
    }
    return username
}

async function collectStatistics(username: string): Promise<UserStatistics> {
    const stats: Array<keyof UserStatistics> = [
        'pp_score',
        'accuracy',
        'play_count',
        'total_score',
        'ranked_score',
        'level',
        'global_rank',
        'country_rank',
        'highest_rank',
    ]
    const user = await prisma.osuUser.findFirst({
        where: { username },
    })
    if (!user) {
        throw new Error(`User ${username} does not exist in the database.`)
    }
    const userStatistics: UserStatistics = {
        username: user.username,
        lastActivity: user.last_activity_date?.toISOString() || 'Unknown',
    }
    for (const stat of stats) {
        try {
            const userStat = await prisma.osuStats.findFirst({
                where: { user_id: user.id, stat_name: stat },
            })
            if (userStat) {
                userStatistics[stat] = userStat.stat_value
            }
        } catch (error) {
            console.error('Error in collectStatistics:', error)
            let errorMessage = 'Failed to do something exceptional'
            if (error instanceof Error) {
                errorMessage = error.message
            }
            throw new Error(errorMessage)
        }
    }
    return userStatistics
}

function formatFieldName(fieldName: string): string {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function embedStatistics(statistics: UserStatistics): Embed {
    const embed: Embed = {
        color: 10181046,
        title: `Statistics for ${statistics.username}`,
        fields: [],
        footer: {
            text: `Last Activity: ${statistics.lastActivity || 'Unknown'}`,
        },
    }

    for (const [key, value] of Object.entries(statistics)) {
        if (key === 'username' || key === 'lastActivity') continue

        embed.fields.push({
            name: formatFieldName(key),
            value: String(value),
            inline: true,
        })
    }

    return embed
}

export default viewUser

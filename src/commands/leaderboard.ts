import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder
} from 'discord.js'
import { CommandModule } from '@/types'
import { prisma } from '@/lib/prisma'
import { Stat, Demographic } from '@/models'
import { User } from '@prisma/client'
import { collectUsers } from '@/func/collectUsers'

const leaderboard: CommandModule = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription(
            "View the leaderboard of the server's best users by stat"
        )
        .addStringOption((option) =>
            option
                .setName('statistic')
                .setDescription('The statistic to compare users by')
                .setRequired(true)
                .addChoices(
                    { name: 'PP Score', value: 'pp_score' },
                    { name: 'Accuracy', value: 'accuracy' },
                    { name: 'Play Count', value: 'play_count' },
                    { name: 'Total Score', value: 'total_score' },
                    { name: 'Ranked Score', value: 'ranked_score' },
                    { name: 'Level', value: 'level' },
                    { name: 'Global Rank', value: 'global_rank' },
                    { name: 'Country Rank', value: 'country_rank' },
                    { name: 'Highest Rank', value: 'highest_rank' }
                )
        )
        .addIntegerOption((option) =>
            option
                .setName('limit')
                .setDescription(
                    'The number of users to show in the leaderboard - default 10'
                )
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('filter_by')
                .setDescription(
                    'The demographic to filter users by - default all'
                )
                .setRequired(false)
                .addChoices(
                    { name: 'Users', value: 'users' },
                    { name: 'Roles', value: 'roles' },
                    { name: 'All', value: 'all' }
                )
        )
        .addBooleanOption((option) =>
            option
                .setName('last_updated')
                .setDescription(
                    "Show when each user's statistic was last updated - default false"
                )
                .setRequired(false)
        ),

    execute: async (interaction: CommandInteraction) => {
        let result_replied = false
        try {
            console.log('Preparing leaderboard')
            const statistic_name = getStatistic(interaction)
            const limit = getLimit(interaction)
            const last_updated = getLastUpdated(interaction)
            const filter_by = getFilterBy(interaction)
            const { users, replied } = await collectUsers(
                filter_by,
                interaction
            )
            if (replied) {
                result_replied = true
            }
            const statistics = await collectLeaderboardStatistics(
                users,
                statistic_name,
                limit
            )
            const leaderboardEmbed = embedLeaderStatistics(
                statistics,
                statistic_name,
                limit,
                last_updated
            )
            if (result_replied) {
                await interaction.editReply({
                    embeds: [leaderboardEmbed],
                    components: [],
                })
            } else {
                await interaction.reply({
                    embeds: [leaderboardEmbed],
                    components: [],
                })
            }
        } catch (error) {
            console.error('Error in compareUserCommand:', error)
            let errorMessage = 'Failed to do something exceptional'
            if (error instanceof Error) {
                errorMessage = error.message
            }
            if (result_replied) {
                await interaction.editReply(errorMessage)
            } else {
                await interaction.reply(errorMessage)
            }
        }
    },
}

function getStatistic(interaction: CommandInteraction): string {
    const statisticOption = interaction.options.data.find(
        (opt) => opt.name === 'statistic'
    )
    const statistic = statisticOption?.value as string | undefined
    if (!statistic) {
        throw new Error(
            'Please provide valid statistic to compare the users by.'
        )
    }
    return statistic
}
function getLimit(interaction: CommandInteraction): number {
    const statisticOption = interaction.options.data.find(
        (opt) => opt.name === 'limit'
    )
    let statistic = statisticOption?.value as number | undefined
    if (!statistic) {
        statistic = 10
    }
    statistic = Math.min(statistic, 10)
    return statistic
}

function getFilterBy(interaction: CommandInteraction): Demographic {
    const statisticOption = interaction.options.data.find(
        (opt) => opt.name === 'filter_by'
    )
    let statistic = statisticOption?.value as Demographic | undefined
    // If statistic is undefined, default to false
    if (!statistic) {
        statistic = Demographic.All
    }
    return statistic
}

function getLastUpdated(interaction: CommandInteraction): boolean {
    const statisticOption = interaction.options.data.find(
        (opt) => opt.name === 'last_updated'
    )
    let statistic = statisticOption?.value as boolean | undefined
    // If statistic is undefined, default to false
    if (!statistic) {
        statistic = false
    }
    return statistic
}

async function collectLeaderboardStatistics(
    discordUserIds: string[],
    statistic: string,
    limit: number
): Promise<Stat[]> {
    const stats: Stat[] = []
    let order_by: 'asc' | 'desc' = 'desc'
    if (
        statistic === 'global_rank' ||
        statistic === 'country_rank' ||
        statistic === 'highest_rank'
    ) {
        order_by = 'asc'
    }
    const users: User[] = (await prisma.user.findMany({
        where: {
            discord_user_id: { in: discordUserIds },
            in_server: true,
        }
    }))

    // Filter out null osu_user_id
    const osuUserIds = users
        .filter((u) => u.osu_user_id !== null)
        .map((u) => u.osu_user_id!) as string[]

    const leaderboardStats = await prisma.osuStats.findMany({
        where: {
            stat_name: statistic,
            user_id: { in: osuUserIds },
        },
        take: limit,
        orderBy: { stat_value: order_by },
        include: { User: true },
    })

    leaderboardStats.forEach((stat) => {
        if (stat.User) {
            stats.push({
                username: stat.User.username,
                last_updated: stat.last_updated.toISOString(),
                stat_value: stat.stat_value!,
            })
        }
    })

    return stats
}

function formatFieldName(fieldName: string): string {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function embedLeaderStatistics(
    statistics: Stat[],
    stat_name: string,
    limit: number,
    last_updated: boolean = false
): EmbedBuilder {
    const titleStatistic = formatFieldName(stat_name);

    const embed = new EmbedBuilder()
        .setColor(3447003)
        .setTitle(`Top ${limit} Leaderboard - ${titleStatistic}`)
        .setDescription(`Showing the top ${limit} users ranked by ${titleStatistic}`)
        .setFooter({ text: `Leaderboard last updated on ${new Date().toLocaleDateString()}` });

    statistics.slice(0, limit).forEach((stat, index) => {
        let fieldValue = `Value: ${stat.stat_value}`;
        if (last_updated) {
            fieldValue += `\nLast Updated: ${stat.last_updated}`;
        }
        embed.addFields({
            name: `#${index + 1} - ${stat.username}`,
            value: fieldValue,
            inline: false,
        });
    });

    return embed;
}

export default leaderboard
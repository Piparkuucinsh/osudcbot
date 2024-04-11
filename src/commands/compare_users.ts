import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandModule } from '@/types'
import { prisma } from '@/lib/prisma'
import { UserStatistics, StatisticalProperties } from '@/models'
import { DiscordUser, OsuStats, OsuUser, User } from '@prisma/client'

const compareUsers: CommandModule = {
    data: new SlashCommandBuilder()
        .setName('compare_users')
        .setDescription('Compare the statistics of two users')
        .addUserOption((option) =>
            option
                .setName('user_1')
                .setDescription('The first user to compare')
                .setRequired(true)
        )
        .addUserOption((option) =>
            option
                .setName('user_2')
                .setDescription('The second user to compare')
                .setRequired(true)
        ),

    execute: async (interaction: CommandInteraction) => {
        try {
            console.log('Comparing user statistics')
            const usernames = getUsername(interaction)
            const username1 = usernames[0]
            const username2 = usernames[1]
            const statistics1 = await collectStatistics(username1)
            const statistics2 = await collectStatistics(username2)
            const comparisonEmbed = compareAndEmbedStatistics(
                statistics1,
                statistics2
            )
            await interaction.reply({ embeds: [comparisonEmbed] })
        } catch (error) {
            console.error('Error in compareUserCommand:', error)
            let errorMessage = 'Failed to do something exceptional'
            if (error instanceof Error) {
                errorMessage = error.message
            }
            await interaction.reply(errorMessage)
        }
    },
}

function getUsername(interaction: CommandInteraction): [string, string] {
    const userOption1 = interaction.options.getUser('user_1')
    const userOption2 = interaction.options.getUser('user_2')
    if (!userOption1 || !userOption2) {
        throw new Error('Please provide valid users.')
    }
    if (userOption1.username === userOption2.username) {
        throw new Error('Please provide two different users to compare.')
    }
    return [userOption1.username, userOption2.username]
}

async function collectStatistics(username: string): Promise<UserStatistics> {
    const userStatistics: UserStatistics = {
        username: username,
        lastActivity: 'Unknown',
        stats: {},
    }
    try {
        const discordUser: DiscordUser | null = await prisma.discordUser.findFirst({
            where: { username: username },
        })
        if (discordUser === null) {
            throw new Error(`No DiscordUser found for username ${username}`)
        }
        const user: User | null = await prisma.user.findFirst({
            where: { discord_user_id: discordUser!.id },
        })
        if (user === null) {
            throw new Error(`No User found for DiscordUser ${username}`)
        }

        const osuUser: OsuUser | null = await prisma.osuUser.findFirst({
            where: { id: user!.osu_user_id! },
        })
        if (osuUser === null) {
            throw new Error(`No OsuUser found for User ${username}`)
        }
        userStatistics.username = osuUser.username
        userStatistics.lastActivity = osuUser.last_activity_date?.toISOString() || 'Unknown'
        const stats: Array<keyof StatisticalProperties> = [
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
        for (const stat of stats) {
            try {
                const userStat: OsuStats | null = await prisma.osuStats.findFirst({
                    where: { user_id: osuUser.id, stat_name: stat },
                })
                if (userStat) {
                    userStatistics.stats[stat] = userStat.stat_value!
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
    } catch (error) {
        console.error('Error in collectStatistics:', error)
    }
    return userStatistics
}

function formatFieldName(fieldName: string): string {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function compareAndEmbedStatistics(
    statistics1: UserStatistics,
    statistics2: UserStatistics
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(3447003) // Neutral color
        .setTitle(`Comparison: ${statistics1.username} vs ${statistics2.username}`)
        .setFooter({ text: `Comparison as of ${new Date().toLocaleDateString()}` });

    // Predefined keys for comparison
    const keys: (keyof StatisticalProperties)[] = [
        'pp_score',
        'accuracy',
        'play_count',
        'total_score',
        'ranked_score',
        'level',
        'global_rank',
        'country_rank',
        'highest_rank',
    ];

    for (const key of keys) {
        const value1 = statistics1.stats[key] ?? 'N/A';
        const value2 = statistics2.stats[key] ?? 'N/A';
        let comparisonResult = '';

        if (value1 !== 'N/A' && value2 !== 'N/A') {
            if (value1 > value2) {
                comparisonResult = '🔼';
            } else if (value1 < value2) {
                comparisonResult = '🔽';
            } else {
                comparisonResult = '➖';
            }

            // Adjust for rank fields
            if (
                key === 'global_rank' ||
                key === 'country_rank' ||
                key === 'highest_rank'
            ) {
                comparisonResult =
                    comparisonResult === '🔼'
                        ? '🔽'
                        : comparisonResult === '🔽'
                            ? '🔼'
                            : '➖';
            }
        }

        embed.addFields({
            name: formatFieldName(key),
            value: `${value1} vs ${value2} ${comparisonResult}`,
            inline: true,
        });
    }

    return embed;
}
export default compareUsers

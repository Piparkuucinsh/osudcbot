import { SlashCommandBuilder, CommandInteraction, User } from "discord.js";
import { CommandModule } from "@/types";
import { prisma } from "@/lib/prisma";

interface StatisticalProperties {
    pp_score?: number;
    accuracy?: number;
    play_count?: number;
    total_score?: number;
    ranked_score?: number;
    level?: number;
    global_rank?: number;
    country_rank?: number;
    highest_rank?: number;
}

interface UserStatistics {
    username: string;
    lastActivity?: string;
    stats: StatisticalProperties;
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
        .setName("view_user")
        .setDescription("Views the statistics of a user")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to view")
                .setRequired(true)),

    execute: async (interaction: CommandInteraction) => {
        try {
            console.log('Viewing user statistics')
            const username = getUsername(interaction);
            const statistics = await collectStatistics(username);
            const statistics_embed = embedStatistics(statistics);
            await interaction.reply({embeds: [statistics_embed]});
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
    const userOption = interaction.options.getUser('user');
    if (!userOption) {
        throw new Error("Please provide a user.");
    }
    return userOption.username;
}

async function collectStatistics(username: string): Promise<UserStatistics> {
    let userStatistics: UserStatistics = { username: username, lastActivity: 'Unknown', stats: {} };
    try {
        const discordUser = await prisma.discordUser.findFirst({
            where: { username: username },
        });
        const user = await prisma.user.findFirst({
            where: { discord_user_id: discordUser!.id },
        });

        const osuUser = await prisma.osuUser.findFirst({
            where: { id: user!.osu_user_id! },
        });
        if (!osuUser) {
            throw new Error(`User ${username} does not exist in the database.`);
        }
        userStatistics = { 
            username: osuUser.username, 
            lastActivity: osuUser.last_activity_date?.toISOString() || 'Unknown',
            stats: {} };
        const stats: Array<keyof StatisticalProperties> = ['pp_score', 'accuracy', 'play_count', 'total_score', 'ranked_score', 'level', 'global_rank', 'country_rank', 'highest_rank'];
        for (const stat of stats) {
            try {
                const userStat = await prisma.osuStats.findFirst({
                    where: { user_id: osuUser.id, stat_name: stat }
                });
                if (userStat) {
                    userStatistics.stats[stat] = userStat.stat_value!;
                }
            }
            catch (error) {
                console.error('Error in collectStatistics:', error);
                let errorMessage = "Failed to do something exceptional";
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                throw new Error(errorMessage);
            }
        }
    } catch (error) {
        console.error('Error in collectStatistics:', error);
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

    for (const [key, value] of Object.entries(statistics.stats)) {
        if (value !== undefined) {
            embed.fields.push({
                name: formatFieldName(key),
                value: value.toString(), // Convert numerical value to string
                inline: true
            });
        }
    }

    return embed
}

export default viewUser

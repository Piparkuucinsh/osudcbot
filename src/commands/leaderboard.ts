import { SlashCommandBuilder, 
    CommandInteraction, 
    UserSelectMenuBuilder, 
    RoleSelectMenuBuilder, 
    ActionRowBuilder,
    ComponentType,
    ChatInputCommandInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder} from "discord.js";
import { CommandModule } from "types";
import { prisma } from "../lib/prisma";
import { stat } from "fs";

interface Stat {
    username: string;
    last_updated: string;
    stat_value: number;
}

type EmbedField = {
    place: number;
    name: string;
    value: string;
    last_updated: string;
    inline: boolean;
    color: number;
};

type Embed = {
    color: number;
    title: string;
    description: string;
    fields: EmbedField[];
    footer?: {
        text: string;
    };
};

enum Demographic {
    Users = 'users',
    Roles = 'roles',
    All = 'all'
}

const leaderboard: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View the leaderboard of the server's best users by stat")
        .addStringOption(option =>
            option.setName("statistic")
                .setDescription("The statistic to compare users by")
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
                ))
        .addIntegerOption(option =>
            option.setName("limit")
                .setDescription("The number of users to show in the leaderboard - default 10")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("filter_by")
                .setDescription("The demographic to filter users by - default all")
                .setRequired(false)
                .addChoices(
                    { name: 'Users', value: 'users' },
                    { name: 'Roles', value: 'roles' },
                    { name: 'All', value: 'all' }
                ))
        .addBooleanOption(option =>
            option.setName("last_updated")
                .setDescription("Show when each user's statistic was last updated - default false")
                .setRequired(false)),

    execute: async (interaction: CommandInteraction) => {
        let result_replied = false;
        try {
            console.log('Preparing leaderboard')
            const statistic_name = getStatistic(interaction);
            const limit = getLimit(interaction);
            const last_updated = getLastUpdated(interaction);
            const filter_by = getFilterBy(interaction);
            const { users, replied } = await collectUsers(filter_by, interaction);
            if (replied) {
                result_replied = true;
            }
            const statistics = await collectLeaderboardStatistics(users, statistic_name, limit);
            const leaderboardEmbed = embedLeaderStatistics(statistics, statistic_name, limit, last_updated);
            if (result_replied) {
                await interaction.editReply({embeds: [leaderboardEmbed], components: []});
            }
            else {
                await interaction.reply({embeds: [leaderboardEmbed], components: []});
            }
        } catch (error) {
            console.error('Error in compareUserCommand:', error);
            let errorMessage = "Failed to do something exceptional";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if(result_replied) {
                await interaction.editReply(errorMessage);
            }
            else {
                await interaction.reply(errorMessage);
            }
        }
    },
};

function getStatistic(interaction: CommandInteraction): string {
    const statisticOption = interaction.options.data.find(opt => opt.name === 'statistic');
    const statistic = statisticOption?.value as string | undefined;
    if (!statistic) {
        throw new Error("Please provide valid statistic to compare the users by.");
    }
    return statistic;
}
function getLimit(interaction: CommandInteraction): number {
    const statisticOption = interaction.options.data.find(opt => opt.name === 'limit');
    let statistic = statisticOption?.value as number | undefined;
    if (!statistic) {
        statistic = 10;
    }
    statistic = Math.min(statistic, 10);
    return statistic;
}

function getFilterBy(interaction: CommandInteraction): Demographic {
    const statisticOption = interaction.options.data.find(opt => opt.name === 'filter_by');
    let statistic = statisticOption?.value as Demographic | undefined;
    // If statistic is undefined, default to false
    if (!statistic) {
        statistic = Demographic.All;
    }
    return statistic;
}

function getLastUpdated(interaction: CommandInteraction): boolean {
    const statisticOption = interaction.options.data.find(opt => opt.name === 'last_updated');
    let statistic = statisticOption?.value as boolean | undefined;
    // If statistic is undefined, default to false
    if (!statistic) {
        statistic = false;
    }
    return statistic;
}

async function collectLeaderboardStatistics(discordUserIds: string[], statistic: string, limit: number): Promise<Stat[]> {
    let stats: Stat[] = [];
    let order_by: 'asc' | 'desc' = 'desc';
    if (statistic === 'global_rank' || statistic === 'country_rank' || statistic === 'highest_rank') {
        order_by = 'asc';
    }
    const users = await prisma.user.findMany({
        where: {
            discord_user_id: { in: discordUserIds },
            in_server: true
        },
        select: {
            osu_user_id: true
        }
    });

    // Filter out null osu_user_id
    const osuUserIds = users
        .filter(u => u.osu_user_id !== null)
        .map(u => u.osu_user_id!) as string[];

    const leaderboardStats = await prisma.osuStats.findMany({
        where: {
            stat_name: statistic,
            user_id: { in: osuUserIds }
        },
        take: limit,
        orderBy: { stat_value: order_by },
        include: {
            User: true
        }
    });

    leaderboardStats.forEach(stat => {
        if (stat.User) {
            stats.push({
                username: stat.User.username,
                last_updated: stat.last_updated.toISOString(),
                stat_value: stat.stat_value!,
            });
        }
    });

    return stats;
}


function formatFieldName(fieldName: string): string {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function embedLeaderStatistics(statistics: Stat[], stat_name: string, limit: number, last_updated: boolean = false): Embed {
    const titleStatistic = formatFieldName(stat_name);

    const embed: Embed = {
        color: 3447003, // Consider changing this based on the context
        title: `Top ${limit} Leaderboard - ${titleStatistic}`,
        description: `Showing the top ${limit} users ranked by ${titleStatistic}.`,
        fields: statistics.map((stat, index) => ({
            name: `#${index + 1} - ${stat.username}`,
            value: `Value: ${stat.stat_value}`,
            last_updated: stat.last_updated,
            inline: false
        })) as EmbedField[],
        footer: {
            text: `Leaderboard last updated on ${new Date().toLocaleDateString()}`
        },
        // Optional: Add author or thumbnail if relevant
    };

    if (last_updated) {
        embed.fields.forEach(field => {
            field.value += `\nLast Updated: ${field.last_updated}`;
        });
    }

    return embed;
}


async function collectUsers(filter_by: Demographic, interaction: CommandInteraction): Promise<{users: string[], replied: boolean}> {
    let users: string[] = [];
    let replied = false;
    if (filter_by === Demographic.Users) {
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId(interaction.id)
            .setPlaceholder('Select users')
            .setMinValues(1)
            .setMaxValues(20);
            
        const actionRow = new ActionRowBuilder<UserSelectMenuBuilder>()
            .setComponents(userSelect);

        const reply = await interaction.reply({
            components: [actionRow],
            content: 'Select users',
            ephemeral: true
        });
        replied = true;

        return new Promise((resolve) => {
            const collector = interaction.channel!.createMessageComponentCollector({
                componentType: ComponentType.UserSelect,
                filter: (i) => i.customId === interaction.id && i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async (i) => {
                i.deferUpdate();
                // Add collected user IDs to the users array
                i.values.forEach(value => {
                    const userId = value;
                    if (!users.includes(userId)) {
                        users.push(userId);
                    }
                });

                resolve({users, replied});
            });

            collector.on('end', async () => {
                // Resolve the promise with the collected users when the collector ends
                resolve({users, replied});
            });
        });
    }
    else if (filter_by === Demographic.Roles) {
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(interaction.id)
            .setPlaceholder('Select roles')
            .setMinValues(1)
            .setMaxValues(20);
            
        const actionRow = new ActionRowBuilder<RoleSelectMenuBuilder>()
            .setComponents(roleSelect);

        const reply = await interaction.reply({
            components: [actionRow],
            content: 'Select roles',
            ephemeral: true
        });

        replied = true;

        return new Promise((resolve) => {
            const collector = interaction.channel!.createMessageComponentCollector({
                componentType: ComponentType.RoleSelect,
                filter: (i) => i.customId === interaction.id && i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async (i) => {
                // Add collected user IDs to the users array
                i.deferUpdate();
                const roleIds = i.values;
                for (const roleId of roleIds) {
                    const role = await interaction.guild!.roles.fetch(roleId);
                    if (role && role.members) {
                        role.members.forEach(member => {
                            const userId = member.id;
                            if (!users.includes(userId)) {
                                users.push(userId);
                            }
                        });
                    }
                }

                resolve({users, replied});
            });

            collector.on('end', async () => {
                // Resolve the promise with the collected users when the collector ends
                resolve({users, replied});
            });
        });
    }
    else if (filter_by === Demographic.All) {
        const allUsers = await interaction.guild!.members.fetch();
        allUsers.forEach(user => {
            users.push(user.id);
        });
    }
    return {users, replied};
}


export default leaderboard;

import {
    SlashCommandBuilder,
    CommandInteraction,
    UserSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder
} from "discord.js";

import { CommandModule } from "@/types";
import { v2 } from "osu-api-extended";
import { prisma } from "@/lib/prisma";
import { stat } from "fs";


interface Achievement {
    beatmapId: bigint;
    beatmapName: string;
    username: string;
    playCount: number;
    rank: number;
    percentile: number;
    profilePicture: string;
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

const top_achievement: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("top_achievement")
        .setDescription("View the top achievement of the week")
        .addStringOption(option =>
            option.setName("filter_by")
                .setDescription("The demographic to filter users by - default all")
                .setRequired(false)
                .addChoices(
                    { name: 'Users', value: 'users' },
                    { name: 'Roles', value: 'roles' },
                    { name: 'All', value: 'all' }
                ))
        .addIntegerOption(option =>
            option.setName("days_limit")
                .setDescription("The number of days to limit the achievement to - default 7")
                .setRequired(false)),

    execute: async (interaction: CommandInteraction) => {
        let result_replied = false;
        try {
            console.log('Preparing top achievement');

            const days_limit = getDaysLimit(interaction);
            const filter_by = getFilterBy(interaction);
            const { users, replied, raw_collect } = await collectUsers(filter_by, interaction);
            if (replied) {
                result_replied = true;
            }
            if (result_replied) {
                await interaction.editReply({ content: `Processing achievements...`, components: [] });
            }
            else {
                await interaction.reply({ content: `Processing achievements...`, components: [] });
                result_replied = true;
            }

            const achievements = await getTopAchievement(users, days_limit);
            console.log(achievements);
            if (!achievements) {
                throw new Error('No achievements found in time period');
            }
            const leaderboardEmbed = createAchievementEmbed(achievements);
            let mentions: string = "";
            if (filter_by === Demographic.All) {
                mentions = `@everyone`;
            } else if (filter_by === Demographic.Roles) {
                mentions = raw_collect.map(id => `<@&${id}>`).join(' ');
            } else if (filter_by === Demographic.Users) {
                mentions = raw_collect.map(id => `<@${id}>`).join(' ');
            }
            if (result_replied) {
                await interaction.editReply({ content: `${mentions}Top achievement of the week`, embeds: [leaderboardEmbed], allowedMentions: {parse:["everyone"]} });
            } else {
                await interaction.reply({ content: `${mentions}Top achievement of the week`, embeds: [leaderboardEmbed], allowedMentions: {parse:["everyone"]} });
            }

        } catch (error) {
            console.error('Error in topAchievementsCommand:', error);
            let errorMessage = "Failed to do something exceptional";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            if (result_replied) {
                await interaction.editReply(errorMessage);
            }
            else {
                await interaction.reply(errorMessage);
            }
        }
    },
};

function getDaysLimit(interaction: CommandInteraction): number {
    const statisticOption = interaction.options.data.find(opt => opt.name === 'days_limit');
    let statistic = statisticOption?.value as number | undefined;
    // If statistic is undefined, default to 7
    if (!statistic) {
        statistic = 7;
    }
    return statistic;
}

function getFilterBy(interaction: CommandInteraction): Demographic {
    const statisticOption = interaction.options.data.find(opt => opt.name === 'filter_by');
    let statistic = statisticOption?.value as Demographic | undefined;
    // If statistic is undefined, default to all
    if (!statistic) {
        statistic = Demographic.All;
    }
    return statistic;
}

async function collectUsers(filter_by: Demographic, interaction: CommandInteraction): Promise<{ users: string[], replied: boolean, raw_collect: string[] }> {
    let users: string[] = [];
    let raw_collect: string[] = [];
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
                        raw_collect.push(userId);
                    }
                });

                resolve({ users, replied, raw_collect });
            });

            collector.on('end', async () => {
                // Resolve the promise with the collected users when the collector ends
                resolve({ users, replied, raw_collect });
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
                        raw_collect.push(role.id);
                        role.members.forEach(member => {
                            const userId = member.id;
                            if (!users.includes(userId)) {
                                users.push(userId);
                            }
                        });
                    }
                }

                resolve({ users, replied, raw_collect });
            });

            collector.on('end', async () => {
                // Resolve the promise with the collected users when the collector ends
                resolve({ users, replied, raw_collect });
            });
        });
    }
    else if (filter_by === Demographic.All) {
        const allUsers = await interaction.guild!.members.fetch();
        allUsers.forEach(user => {
            users.push(user.id);
        });
    }
    return { users, replied, raw_collect };
}


async function getTopAchievement(users: string[], days_limit: number): Promise<Achievement> {
    let mapIds = new Map<number, number>();
    let achievements: Achievement[] = [];
    for (const user_id of users) {
        try {
            const botUser = await prisma.user.findUnique({
                where: {
                    discord_user_id: user_id
                }
            });
            if (!botUser) {
                throw new Error(`User not found in database: ${user_id}`);
            }
            const osu_user_id = botUser.osu_user_id;
            if (!osu_user_id) {
                throw new Error(`Osu user not found in database for discord user: ${user_id}`);
            }
            const userDetails = await v2.user.details(parseInt(osu_user_id));
            const activities = await v2.user.activity(parseInt(osu_user_id), { limit: 100 });
            for (const activity of activities){
                // If the activity didnt happened in the last week, skip
                const activityDate = new Date(activity.created_at);
                let weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - days_limit);
                console.log(activityDate, weekAgo);
                if (activityDate < weekAgo) {
                    continue;
                }

                if (activity.type === 'rank') {
                    const beatmapId = Number(parseInt(activity.beatmap.url.split('/')[2]));
                    if (!mapIds.has(beatmapId)) {
                        const details = await v2.beatmap.id.details(beatmapId);
                        mapIds.set(beatmapId, details.playcount);
                    }
                    const playCount = mapIds.get(beatmapId);
                    achievements.push({
                        beatmapId: BigInt(beatmapId),
                        beatmapName: activity.beatmap.title,
                        username: activity.user.username,
                        playCount: playCount!,
                        rank: activity.rank,
                        percentile: 100.0 - (activity.rank / playCount! * 100),
                        profilePicture: userDetails.avatar_url
                    });
                }
            }
        } catch (error) {
            console.error('Could not process discord user:', user_id);
        }
    }
    console.log(achievements)
    // Sort the achievements by percentile, and return the top 1 as an Achievement
    achievements.sort((a, b) => b.percentile - a.percentile);
    return achievements[0];
}

function createAchievementEmbed(achievement: Achievement): EmbedBuilder {
    // Field for the Beatmap
    const fieldBeatmap = {
        name: `Beatmap`,
        value: `${achievement.beatmapName} (ID: ${achievement.beatmapId.toString()})`,
        inline: true
    };

    // Field for the User who achieved it
    const fieldUser = {
        name: `Achieved by`,
        value: `${achievement.username}`,
        inline: true
    };

    // Field for the distinct number of players on the leaderboard
    const fieldPlayerCount = {
        name: `Distinct Players on Leaderboard`,
        value: `${achievement.playCount}`,
        inline: true
    };

    const fieldRank = {
        name: `Rank Achieved`,
        value: `${achievement.rank}`,
        inline: true
    };

    // Field for the Percentile Achieved
    const fieldPercentile = {
        name: `Percentile Achieved`,
        value: `${achievement.percentile.toFixed(2)}%`,
        inline: true
    };

    return new EmbedBuilder()
        .setColor(3447003) // Color can be adjusted to fit the theme
        .setTitle(`🌟 Top Achievement of the Week 🌟`)
        .setDescription(`Celebrating an outstanding achievement in the community!`)
        .setFields(fieldBeatmap, fieldUser, fieldPlayerCount, fieldRank, fieldPercentile)
        .setThumbnail(achievement.profilePicture)
        .setTimestamp() // Optional, adds the current timestamp
        .setFooter({ text: 'Congratulations!' }); // Customizable footer
}

export default top_achievement;

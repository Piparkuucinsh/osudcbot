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
import { prisma } from "@/lib/prisma";
import { v2 } from "osu-api-extended";
import { stat } from "fs";

interface Stat {
    username: string;
    last_updated: string;
    stat_value: number;
}

interface MapPlayCount {
    beatmapId: bigint;
    beatmapName: string;
    playCount: number;
    beatmapCover?: string;
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

const popular_maps: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("popular_maps")
        .setDescription("View the most popular maps in the server, filter by users or roles")
        .addIntegerOption(option =>
            option.setName("limit")
                .setDescription("The number of maps to show in the leaderboard - default 10")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("filter_by")
                .setDescription("The demographic to filter users by - default all")
                .setRequired(false)
                .addChoices(
                    { name: 'Users', value: 'users' },
                    { name: 'Roles', value: 'roles' },
                    { name: 'All', value: 'all' }
                )),

    execute: async (interaction: CommandInteraction) => {
        let result_replied = false;
        try {
            console.log('Preparing map leaderboard');

            const limit = getLimit(interaction);
            const filter_by = getFilterBy(interaction);
            const { users, replied, raw_collect } = await collectUsers(filter_by, interaction);
            if (replied) {
                result_replied = true;
            }
            if (result_replied) {
                await interaction.editReply({ content: `Processing maps...`, components: [] });
            }
            else {
                await interaction.reply({ content: `Processing maps...`, components: [] });
                result_replied = true;
            }

            const popularMaps = await getPopularMaps(users, limit);
            const leaderboardEmbed = createLeaderboardEmbed(popularMaps, limit);

            if (result_replied) {
                await interaction.editReply({ content: "Map leaderboard", embeds: [leaderboardEmbed] });
            } else {
                await interaction.reply({ content: "Map leaderboard", embeds: [leaderboardEmbed] });
            }
            await createMapPoll(interaction, popularMaps, limit, raw_collect, filter_by);

        } catch (error) {
            console.error('Error in popularMapsCommand:', error);
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

function getLimit(interaction: CommandInteraction): number {
    const statisticOption = interaction.options.data.find(opt => opt.name === 'limit');
    let statistic = statisticOption?.value as number | undefined;
    if (!statistic) {
        statistic = 20;
    }
    statistic = Math.min(statistic, 20);
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


async function getPopularMaps(users: string[], limit: number): Promise<MapPlayCount[]> {
    let mapIds = new Set<bigint>();
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
            const activities = await v2.user.activity(parseInt(osu_user_id), { limit: 10 });
            console.log(activities);
            activities.forEach(activity => {
                if (activity.type === 'rank') {
                    const beatmapId = BigInt(parseInt(activity.beatmap.url.split('/')[2]));
                    mapIds.add(beatmapId);
                }
            });
        } catch (error) {
            console.error('Could not process discord user:', user_id);
        }
    }
    // convert set to array
    let mapPlayCounts: MapPlayCount[] = [];
    for (const mapId of mapIds) {
        // Fetch play count for each map
        const details = await v2.beatmap.id.details(parseInt(mapId.toString()));
        mapPlayCounts.push({ beatmapId: mapId, beatmapName: details.beatmapset.title, playCount: details.beatmapset.play_count, beatmapCover: details.beatmapset.covers.cover });
    }
    mapPlayCounts.sort((a, b) => b.playCount - a.playCount);
    return mapPlayCounts.slice(0, limit);
}

function createLeaderboardEmbed(popularMaps: MapPlayCount[], limit: number): EmbedBuilder {
    const fields = popularMaps.map((map, index) => ({
        name: `#${index + 1} - ${map.beatmapName.toString()}`,
        value: `Play Count: ${map.playCount}`,
        map_cover: map.beatmapCover,
        inline: false
    }));

    return new EmbedBuilder()
        .setColor(3447003)
        .setTitle(`Top ${limit} Popular Maps Leaderboard`)
        .setDescription(`Showing the top ${limit} most played maps.`)
        .setFields(fields);
}

async function createMapPoll(interaction: CommandInteraction, popularMaps: MapPlayCount[], limit: number, raw_collect: string[], filter_by: Demographic) {
    const alphabet = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];
    
    // Limit the number of options to the number of available emojis
    const mapOptions = popularMaps.slice(0, Math.min(limit, alphabet.length));

    let description = mapOptions.map((map, index) => `${alphabet[index]}: ${map.beatmapName}`).join('\n');

    const embed = new EmbedBuilder()
        .setColor('#00D1CD')
        .setTitle('Vote for the Best Map!')
        .setDescription(description);

    let mentions: string = "";
    if (filter_by === Demographic.All) {
        mentions = `@everyone`;
    } else if (filter_by === Demographic.Roles) {
        mentions = raw_collect.map(id => `<@&${id}>`).join(' ');
    } else if (filter_by === Demographic.Users) {
        mentions = raw_collect.map(id => `<@${id}>`).join(' ');
    }

    const pollMessage = await interaction.followUp({ content: mentions, embeds: [embed], fetchReply: true, allowedMentions: {parse:["everyone"]} });

    for (let i = 0; i < mapOptions.length; i++) {
        await pollMessage.react(alphabet[i]);
    }
}



export default popular_maps;

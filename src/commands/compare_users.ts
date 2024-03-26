import { SlashCommandBuilder, CommandInteraction, User } from "discord.js";
import { CommandModule } from "types";
import { prisma } from "../lib/prisma";

interface UserStatistics {
    username: string;
    lastActivity?: string;
    pp_score?: string;
    accuracy?: string;
    play_count?: string;
    total_score?: string;
    ranked_score?: string;
    level?: string;
    global_rank?: string;
    country_rank?: string;
    highest_rank?: string;
}

type EmbedField = {
    name: string;
    value: string;
    inline: boolean;
};

type Embed = {
    color: number;
    title: string;
    fields: EmbedField[];
    footer?: {
        text: string;
    };
};

const compareUsers: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("compare_users")
        .setDescription("Compare the statistics of two users")
        .addStringOption(option =>
            option.setName("username_1")
                .setDescription("The username of the first user to compare")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("username_2")
                .setDescription("The username of the second user to compare")
                .setRequired(true)),

    execute: async (interaction: CommandInteraction) => {
        try {
            console.log('Comparing user statistics')
            const usernames = getUsername(interaction);
            const username1 = usernames[0];
            const username2 = usernames[1];
            const statistics1 = await collectStatistics(username1);
            const statistics2 = await collectStatistics(username2);
            const comparisonEmbed = compareAndEmbedStatistics(statistics1, statistics2);
            await interaction.reply({embeds: [comparisonEmbed]});
        } catch (error) {
            console.error('Error in compareUserCommand:', error);
            let errorMessage = "Failed to do something exceptional";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            await interaction.reply(errorMessage);
        }
    },
};

function getUsername(interaction: CommandInteraction): [string, string] {
    const usernameOption1 = interaction.options.data.find(opt => opt.name === 'username_1');
    const usernameOption2 = interaction.options.data.find(opt => opt.name === 'username_2');
    const username1 = usernameOption1?.value as string | undefined;
    const username2 = usernameOption2?.value as string | undefined;
    if (!username1 || !username2) {
        throw new Error("Please provide valid usernames to compare the users.");
    }
    return [username1, username2];
}

async function collectStatistics(username: string): Promise<UserStatistics> {
    const stats: Array<keyof UserStatistics> = ['pp_score', 'accuracy', 'play_count', 'total_score', 'ranked_score', 'level', 'global_rank', 'country_rank', 'highest_rank'];
    const user = await prisma.osuUser.findFirst({
        where: { username },
    });
    if (!user) {
        throw new Error(`User ${username} does not exist in the database.`);
    }
    let userStatistics: UserStatistics = { username: user.username, lastActivity: user.last_activity_date?.toISOString() || 'Unknown' };
    for (const stat of stats) {
        try {
            const userStat = await prisma.osuStats.findFirst({
                where: { user_id: user.id, stat_name: stat }
            });
            if (userStat) {
                userStatistics[stat] = userStat.stat_value;
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
    return userStatistics;
}


function formatFieldName(fieldName: string): string {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function compareAndEmbedStatistics(statistics1: UserStatistics, statistics2: UserStatistics): Embed {
    const embed: Embed = {
        color: 3447003, // Neutral color
        title: `Comparison: ${statistics1.username} vs ${statistics2.username}`,
        fields: [],
        footer: {
            text: `Comparison as of ${new Date().toLocaleDateString()}`
        }
    };

    // Predefined keys for comparison
    const keys: (keyof UserStatistics)[] = ['pp_score', 'accuracy', 'play_count', 'total_score', 'ranked_score', 'level', 'global_rank', 'country_rank', 'highest_rank'];

    for (const key of keys) {
        const value1 = statistics1[key] ?? 'N/A';
        const value2 = statistics2[key] ?? 'N/A';
        let comparisonResult = '';

        if (value1 !== 'N/A' && value2 !== 'N/A') {
            const num1 = parseFloat(value1);
            const num2 = parseFloat(value2);

            if (num1 > num2) {
                comparisonResult = '🔼'; // Value for user1 is higher
            } else if (num1 < num2) {
                comparisonResult = '🔽'; // Value for user1 is lower
            } else {
                comparisonResult = '➖'; // Values are equal
            }
        }

        embed.fields.push({
            name: formatFieldName(key),
            value: `${value1} vs ${value2} ${comparisonResult}`,
            inline: true
        });
    }

    return embed;
}


export default compareUsers;

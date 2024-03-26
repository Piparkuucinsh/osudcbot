import { SlashCommandBuilder, CommandInteraction, User } from "discord.js";
import { CommandModule } from "types";
import { prisma } from "../lib/prisma";

interface UserGameStatistics {
    combo_bonus: number;
    max_combo: number;
    accuracy: number;
    elapsed: number;
    total_obj: number;
    spinner_count: number;
    mod_multiplier: number;
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

const leaderboard: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View the leaderboard of the server's best weekly plays")
        .addStringOption(option =>
            option.setName("mode")
                .setDescription("The gamemode to view the leaderboard for")
                .setRequired(true)),

    execute: async (interaction: CommandInteraction) => {
        try {
            console.log('Preparing leaderboard')
            const gamemode = getGamemode(interaction);
            const statistics = await collectLeaderboardStatistics(gamemode);
            const leaderboardEmbed = embedLeaderStatistics(statistics);
            await interaction.reply({embeds: [leaderboardEmbed]});
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

function getGamemode(interaction: CommandInteraction): string {
    const gamemodeOption = interaction.options.data.find(opt => opt.name === 'mode');
    const gamemode = gamemodeOption?.value as string | undefined;
    if (!gamemode) {
        throw new Error("Please provide valid usernames to compare the users.");
    }
    return gamemode;
}

async function collectLeaderboardStatistics(gamemode: string): Promise<UserGameStatistics> {
    let userGameStatistics = UserGameStatistics[];
    const userList = await prisma.user.findMany({
        select: {id}
    });
    for (const user of userList) {
        

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

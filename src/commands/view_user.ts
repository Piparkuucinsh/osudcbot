import { SlashCommandBuilder, CommandInteraction, User } from "discord.js";
import { CommandModule } from "types";
import { prisma } from "../lib/prisma";

interface UserStatistics {
    username: string;
    pp_score?: number;
    accuracy?: number;
    play_count?: number;
    total_score?: number;
    ranked_score?: number;
    level?: number;
    global_rank?: number;
    country_rank?: number;
}

const viewUserCommand: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("view_user")
        .setDescription("Views the statistics of a user")
        .addStringOption(option =>
            option.setName("username")
                .setDescription("The username of the user to view")
                .setRequired(true)),

    execute: async (interaction: CommandInteraction) => {
        try {
            const username = getUsername(interaction);
            const statistics = await collectStatistics(username);
            await interaction.reply(`User ${username} has been successfully deleted from the database.`);
        } catch (error) {
            console.error('Error in viewUserCommand:', error);
            let errorMessage = "Failed to do something exceptional";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            await interaction.reply(errorMessage);
        }
    },
};

function getUsername(interaction: CommandInteraction): string {
    const usernameOption = interaction.options.data.find(opt => opt.name === 'username');
    const username = usernameOption?.value as string | undefined;
    if (!username) {
        throw new Error("Please provide a username to view the user.");
    }
    return username;
}

async function collectStatistics(username: string): Promise<UserStatistics> {
    let userStatistics: UserStatistics = {
        username: username,
    };
    return userStatistics;
}


export default viewUserCommand;

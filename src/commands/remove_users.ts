import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { CommandModule } from "types";
import { prisma } from "../lib/prisma";

const removeUserCommand: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("remove_user")
        .setDescription("Removes a user from the database")
        .addStringOption(option =>
            option.setName("username")
                .setDescription("The username of the user to remove")
                .setRequired(true)),

    execute: async (interaction: CommandInteraction) => {
        try {
            const username = getUsername(interaction);
            await deleteUser(username);
            await interaction.reply(`User ${username} has been successfully deleted from the database.`);
        } catch (error) {
            console.error('Error in removeUserCommand:', error);
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
        throw new Error("Please provide a username to delete.");
    }
    return username;
}

async function deleteUser(username: string): Promise<void> {
    const discordUser = await prisma.discordUser.findFirst({
        where: { username },
    });

    if (!discordUser) {
        throw new Error(`User ${username} does not exist in the database.`);
    }

    await prisma.user.delete({
        where: { discord_user_id: discordUser.id },
    });
}

export default removeUserCommand;

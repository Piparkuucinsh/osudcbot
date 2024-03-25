import { config } from "../config";
import { SlashCommandBuilder } from "discord.js";
import { CommandModule } from "types";
import { prisma } from "../lib/prisma";

const updateUsers: CommandModule = {
    data: new SlashCommandBuilder()
        .setName("update_users")
        .setDescription("Updates users in the database"),
    execute: async (interaction) => {

        if (interaction.channelId !== config.bot_channel_id) {
            await interaction.reply("This command can't be used in this channel.");
            return;
        }

        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply("Error: Guild not found.");
            return;
        }

        const members = await guild.members.fetch();

        let usersAdded = [];
        for (const member of members.values()) {
            // Use Prisma to check if the member is in the database
            const discordUser = await prisma.discordUser.findUnique({
                where: {
                    id: BigInt(member.id)
                },
            });

            // If not found, add them to the database
            if (!discordUser) {
                const joinedDate = member.joinedAt ? member.joinedAt : new Date();

                await prisma.discordUser.create({
                    data: {
                        id: BigInt(member.id),
                        username: member.user.tag, // Discord tag includes the username and discriminator
                        registration_date: joinedDate, // When they joined the server
                        last_activity_date: new Date(), // Set to current date-time for now
                        deleted: false // Assuming the user is not deleted when they're being added
                    }
                });
                usersAdded.push(member.displayName);
            }
        }

        // Send response back
        if (usersAdded.length > 0) {
            await interaction.reply(`Added users to database: ${usersAdded.join(', ')}`);
        } else {
            await interaction.reply("No new users were added to the database.");
        }
        // TODO
    },
};

export default updateUsers;

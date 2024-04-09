import { config } from '@/config'
import { SlashCommandBuilder } from 'discord.js'
import { CommandModule } from '@/types'
import { getCurrentRoleIds, getRoleIdWithRank } from '@/utils/roles'
import { prisma } from '@/lib/prisma'
import { v2 } from 'osu-api-extended'

const updateUsers: CommandModule = {
    data: new SlashCommandBuilder()
        .setName('update_users')
        .setDescription('Updates users in the database'),
    execute: async (interaction) => {
        if (interaction.channelId !== config.bot_channel_id) {
            await interaction.reply(
                "This command can't be used in this channel."
            )
            return
        }

        const guild = interaction.guild
        if (!guild) {
            await interaction.reply('Error: Guild not found.')
            return
        }

        const members = await guild.members.fetch()

        const usersAdded = []
        for (const member of members.values()) {
            if (member.user.bot) {
                member.roles.add(
                    guild.roles.cache.find((r) => r.name === 'Bot')!
                )
                continue
            }
            console.log(`Processing ${member.displayName}`)
            // Use Prisma to check if the member is in the database
            const discordUser = await prisma.discordUser.findUnique({
                where: {
                    id: member.id,
                },
            })

            // If not found, add them to the database
            if (!discordUser) {
                const joinedDate = member.joinedAt
                    ? member.joinedAt
                    : new Date()

                await prisma.discordUser.create({
                    data: {
                        id: member.id,
                        username: member.user.tag, // Discord tag includes the username and discriminator
                        registration_date: joinedDate, // When they joined the server
                        last_activity_date: new Date(), // Set to current date-time for now
                        deleted: false, // Assuming the user is not deleted when they're being added
                    },
                })
                usersAdded.push(member.displayName)
            }
            const botUser = await prisma.user.findUnique({
                where: {
                    discord_user_id: member.id,
                },
            })
            if (botUser) {
                // Get the osu user from the database
                const osu_user_id = botUser!.osu_user_id!
                const osuUserFromDB = await prisma.osuUser.findUnique({
                    where: {
                        id: osu_user_id,
                    },
                })
                const username = osuUserFromDB!.username
                const osuUserFromAPI = await v2.user.details(username, 'osu')
                if (!osuUserFromAPI) {
                    console.log('No osu user found')
                    continue
                }
                console.log('Got osu user from API')
                const user_country_rank = osuUserFromAPI.statistics.country_rank
                if (user_country_rank === null) {
                    console.log('User country rank is null')
                    continue
                }
                const roleId = getRoleIdWithRank(user_country_rank)
                console.log(`Role ID: ${roleId}`)
                const currentRoleIds = await getCurrentRoleIds(member.id)
                if (currentRoleIds) {
                    await member.roles.remove(currentRoleIds)
                }
                if (roleId) {
                    await member.roles.add(roleId)
                }
            }
        }

        // Send response back
        if (usersAdded.length > 0) {
            await interaction.reply(
                `Added users to database: ${usersAdded.join(', ')}`
            )
        } else {
            await interaction.reply('No new users were added to the database.')
        }
        // TODO
    },
}

export default updateUsers

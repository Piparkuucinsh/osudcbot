import { config } from '@/config'
import { SlashCommandBuilder } from 'discord.js'
import { CommandModule } from '@/types'
import { prisma } from '@/lib/prisma'
import { v2 } from 'osu-api-extended'
import fs from 'fs'

interface RoleConfig {
    name: string
    color: string
    lower_bound?: number
    upper_bound?: number
    hoist?: boolean
}

// Read role information from JSON file
const roles: RoleConfig[] = JSON.parse(fs.readFileSync('roles.json', 'utf-8'))

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

        let usersAdded = []
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
                    id: member.id
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
                    discord_user_id: member.id
                }
            });
            console.log(`Bot user:`);
            console.log(botUser);
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
                const user_pp_score = osuUserFromAPI.statistics.pp;
                let roleToAdd = null;
                let rolesToRemove = member.roles.cache.filter((r) =>
                    roles.some((role) => role.name === r.name)
                )

                for (const role of roles) {
                    if (!role.lower_bound && !role.upper_bound) {
                        console.log(
                            `Role ${role.name} is missing bounds(${role.lower_bound} - ${role.upper_bound}), skipping.`
                        )
                        continue
                    }
                    console.log(`Checking role: ${role.name}`)
                    console.log(
                        `Role bounds: ${role.lower_bound} - ${role.upper_bound}`
                    )
                    console.log(`User pp score: ${user_pp_score}`)
                    if (
                        user_pp_score >= role.lower_bound! &&
                        user_pp_score < role.upper_bound!
                    ) {
                        roleToAdd = guild.roles.cache.find(
                            (r) => r.name === role.name
                        )
                        rolesToRemove = rolesToRemove.filter(
                            (r) => r.name !== role.name
                        )
                    }
                }
                console.log(
                    `Roles to add: ${roleToAdd ? roleToAdd.name : 'None'}`
                )
                console.log(
                    `Roles to remove: ${rolesToRemove.map((r) => r.name).join(', ')}`
                )
                // Use or operrator to check if roleToAdd is not null or roleToRemove is not empty
                if (roleToAdd || rolesToRemove.size > 0) {
                    await member.roles.remove(rolesToRemove)
                    await member.roles.add(roleToAdd!)
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

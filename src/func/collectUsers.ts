import {
    CommandInteraction,
    UserSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ActionRowBuilder,
    ComponentType
} from 'discord.js'
import { Demographic } from '@/models'

export async function collectUsers(
    filter_by: Demographic,
    interaction: CommandInteraction
): Promise<{ users: string[]; replied: boolean; raw_collect: string[] }> {
    const users: string[] = []
    const raw_collect: string[] = []
    let replied = false
    if (filter_by === Demographic.Users) {
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId(interaction.id)
            .setPlaceholder('Select users')
            .setMinValues(1)
            .setMaxValues(20)

        const actionRow =
            new ActionRowBuilder<UserSelectMenuBuilder>().setComponents(
                userSelect
            )

        await interaction.reply({
            components: [actionRow],
            content: 'Select users',
            ephemeral: true,
        })
        replied = true

        return new Promise((resolve) => {
            const collector =
                interaction.channel!.createMessageComponentCollector({
                    componentType: ComponentType.UserSelect,
                    filter: (i) =>
                        i.customId === interaction.id &&
                        i.user.id === interaction.user.id,
                    time: 60000,
                })

            collector.on('collect', async (i) => {
                i.deferUpdate()
                // Add collected user IDs to the users array
                i.values.forEach((value) => {
                    const userId = value
                    if (!users.includes(userId)) {
                        users.push(userId)
                        raw_collect.push(userId)
                    }
                })

                resolve({ users, replied, raw_collect })
            })

            collector.on('end', async () => {
                // Resolve the promise with the collected users when the collector ends
                resolve({ users, replied, raw_collect })
            })
        })
    } else if (filter_by === Demographic.Roles) {
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(interaction.id)
            .setPlaceholder('Select roles')
            .setMinValues(1)
            .setMaxValues(20)

        const actionRow =
            new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
                roleSelect
            )

        await interaction.reply({
            components: [actionRow],
            content: 'Select roles',
            ephemeral: true,
        })

        replied = true

        return new Promise((resolve) => {
            const collector =
                interaction.channel!.createMessageComponentCollector({
                    componentType: ComponentType.RoleSelect,
                    filter: (i) =>
                        i.customId === interaction.id &&
                        i.user.id === interaction.user.id,
                    time: 60000,
                })

            collector.on('collect', async (i) => {
                // Add collected user IDs to the users array
                i.deferUpdate()
                const roleIds = i.values
                for (const roleId of roleIds) {
                    const role = await interaction.guild!.roles.fetch(roleId)
                    if (role && role.members) {
                        raw_collect.push(role.id)
                        role.members.forEach((member) => {
                            const userId = member.id
                            if (!users.includes(userId)) {
                                users.push(userId)
                            }
                        })
                    }
                }

                resolve({ users, replied, raw_collect })
            })

            collector.on('end', async () => {
                // Resolve the promise with the collected users when the collector ends
                resolve({ users, replied, raw_collect })
            })
        })
    } else if (filter_by === Demographic.All) {
        const allUsers = await interaction.guild!.members.fetch()
        allUsers.forEach((user) => {
            users.push(user.id)
        })
    }
    return { users, replied, raw_collect }
}
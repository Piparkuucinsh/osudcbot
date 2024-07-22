import {
    Client,
    ClientEvents,
    Collection,
    Events,
    GatewayIntentBits,
} from 'discord.js'
import type { CommandModule } from '@/types.d.ts'

import getEventList from '@/init/getEventsList.ts'
import getCommandList from '@/init/getCommandList.ts'

import 'dotenv/config'

class ExClient extends Client {
    commands = new Collection<string, CommandModule>()
}

export const init_dc_client = async () => {
    const discordClient = new ExClient({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMessages,
        ],
    })

    await discordClient.login(process.env.BOT_TOKEN)

    const events = getEventList()

    // add event listeners
    try {
        for (const event of events) {
            if (event.once) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                discordClient.once(event.name, (...args: any[]) =>
                    event.execute(...args)
                )
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                discordClient.on(event.name, (...args: any[]) =>
                    event.execute(...args)
                )
            }
        }
    } catch (error) {
        console.error('Failed to set up Discord client events:')
        throw error
    }

    //register slash commands
    const commands = getCommandList()

    for (const command of commands) {
        discordClient.commands.set(command.data.name, command)
    }

    discordClient.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return

        const command = discordClient.commands.get(interaction.commandName)

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            )
            return
        }

        try {
            await command.execute(interaction)
            console.log(`Command '${interaction.commandName}' executed`)
        } catch (error) {
            console.error(error)
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                })
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                })
            }
        }
    })

    return discordClient
}

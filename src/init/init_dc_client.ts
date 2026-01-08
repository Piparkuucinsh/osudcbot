import {
    Client,
    ClientEvents,
    Collection,
    Events,
    GatewayIntentBits,
} from 'discord.js'
import { CommandModule, EventModule } from '@/types'
import { info, error } from '@/lib/log'

import getEventList from '@/init/getEventsList'
import getCommandList from '@/init/getCommandList'

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
        for (const event of events as EventModule<keyof ClientEvents>[]) {
            if (event.once) {
                discordClient.once(
                    event.name,
                    (...args: ClientEvents[typeof event.name]) =>
                        event.execute(...args)
                )
            } else {
                discordClient.on(
                    event.name,
                    (...args: ClientEvents[typeof event.name]) =>
                        event.execute(...args)
                )
            }
        }
    } catch (err) {
        error(`Failed to set up Discord client events: ${String(err)}`)
        throw err
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
            error(`No command matching ${interaction.commandName} was found.`)
            return
        }

        try {
            await command.execute(interaction)
            info(`Command '${interaction.commandName}' executed`)
        } catch (err) {
            error(String(err))
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

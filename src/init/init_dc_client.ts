import {
    Client,
    ClientEvents,
    Collection,
    Events,
    GatewayIntentBits,
} from 'discord.js'
import { CommandModule, EventModule } from '@/types'

import presenceUpdateEvent from '../events/presenceUpdate'
import ReadyEventModule from '../events/onReady'
import onMemberJoinEvent from '../events/onMemberJoin'
import onMemberLeaveEvent from '../events/onMemberLeave'
import getCommandList from '../init/getCommandList'

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

    // add event listeners
    try {
        type AnyEventModule = {
            [K in keyof ClientEvents]: EventModule<K>
        }[keyof ClientEvents]

        const events: AnyEventModule[] = [
            presenceUpdateEvent,
            ReadyEventModule,
            onMemberJoinEvent,
            onMemberLeaveEvent,
        ]

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

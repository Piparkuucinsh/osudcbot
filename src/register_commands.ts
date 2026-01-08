import { config } from '@/init/config'
import { REST, Routes } from 'discord.js'
import 'dotenv/config'
import getCommandList from '@/init/getCommandList'
import { info, error } from '@/lib/log'

const BOT_TOKEN = process.env.BOT_TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const SERVER_ID = config.discord.serverId

if (!BOT_TOKEN) {
    throw Error('no bot_token in env')
}
if (!CLIENT_ID) {
    info(JSON.stringify(config))
    throw Error('no client_id in env')
}
if (!SERVER_ID) {
    throw Error('no server_id in env')
}

const commands = getCommandList()
const commandsJson = commands.map((command) => command.data.toJSON())
info(JSON.stringify(commandsJson))

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(BOT_TOKEN)

// and deploy your commands!
const deployCommands = async () => {
    try {
        info(
            `Started refreshing ${commandsJson.length} application (/) commands.`
        )

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID),
            { body: commandsJson }
        )

        info(
            `Successfully reloaded ${(data as { length: string }).length} application (/) commands.`
        )
    } catch (err) {
        // And of course, make sure you catch and log any errors!
        error(String(err))
    }
}

void deployCommands()

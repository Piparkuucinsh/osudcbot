import { readFileSync } from 'fs'
import { RoleThreshold } from '@/types'

export type Config = {
    bot_channel_id: string
    bot_guild_id: string
    desa?: string
    roles: RoleThreshold[]
}

const configFileContent = readFileSync('config.json', 'utf8')

let parsedConfig: Partial<Config>

try {
    parsedConfig = JSON.parse(configFileContent) as Partial<Config>
} catch {
    throw new Error('Error parsing config file.')
}

export const config: Config = validateConfig(parsedConfig)

function validateConfig(config: Partial<Config>): Config {
    if (!config.bot_channel_id) {
        throw new Error('Missing bot_channel_id in the config file')
    }
    if (!config.bot_guild_id) {
        throw new Error('Missing bot_guild_id in the config file')
    }
    if (!config.roles) {
        throw new Error('Missing roles in the config file')
    }
    return config as Config
}

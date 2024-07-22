import 'dotenv/config'
import { init_dc_client } from '@/init/init_dc_client.ts'
import { osu_login } from '@/init/init_osu_client.ts'
import { Client, Guild } from 'discord.js'
import { config } from './config.ts'

osu_login()
    .then()
    .catch((err) => {
        throw err
    })
export let client: Client
export let guild: Guild
init_dc_client()
    .then(async (cl) => {
        client = cl
        guild = await client.guilds.fetch(config.bot_guild_id)
    })
    .catch((err) => {
        throw err
    })

import { Events, Presence } from 'discord.js'
import { config } from '@/config.ts'
import type { EventModule } from '@/types.d.ts'
import { linkAccounts } from '@/utils/linkAccount.ts'

const presenceUpdateEvent: EventModule<Events.PresenceUpdate> = {
    name: Events.PresenceUpdate,
    once: false,
    execute: (_oldPresence: Presence | null, newPresence: Presence) => {
        try {
            // console.log(newPresence);
            if (!newPresence.guild) {
                return
            }
            console.log(`Presence update guild id: ${newPresence.guild.id}`)
            console.log(`Config server id: ${config.bot_guild_id}`)
            if (newPresence.guild.id != config.bot_guild_id) {
                return
            }
            console.log('Linking accounts...')
            linkAccounts(newPresence)
        } catch (err) {
            console.error(err)
        }
    },
}

export default presenceUpdateEvent

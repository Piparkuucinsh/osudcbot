import { Events, Presence } from 'discord.js'
import { config } from '@/init/config'
import { EventModule } from '@/types'
import { linkAccounts } from '@/features/linkAccounts'
import { info, error } from '@/lib/log'

const presenceUpdateEvent: EventModule<Events.PresenceUpdate> = {
    name: Events.PresenceUpdate,
    once: false,
    execute: (_oldPresence: Presence | null, newPresence: Presence) => {
        try {
            // console.log(newPresence);
            if (!newPresence.guild) {
                return
            }
            info(`Presence update guild id: ${newPresence.guild.id}`)
            info(`Config server id: ${config.discord.serverId}`)
            if (newPresence.guild.id != config.discord.serverId) {
                return
            }
            info('Linking accounts...')
            void linkAccounts(newPresence)
        } catch (err) {
            error(String(err))
        }
    },
}

export default presenceUpdateEvent

import { Events } from 'discord.js'
import { refreshRoles } from '@/func/refreshRoles.ts'
import type { EventModule } from '@/types.d.ts'

const ReadyEventModule: EventModule<Events.ClientReady> = {
    name: Events.ClientReady,
    once: false,
    execute: (c) => {
        console.log(`Ready! Logged in as ${c.user.tag}`)
        refreshRoles()
            .then()
            .catch((error: Error) => {
                throw error
            })
    },
}

export default ReadyEventModule

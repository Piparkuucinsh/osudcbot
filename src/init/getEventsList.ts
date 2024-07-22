import presenceUpdateEvent from '@/events/presenceUpdate.ts'
import ReadyEventModule from '@/events/onReady.ts'
import onMemberJoinEvent from '../events/onMemberJoin.ts'
import onMemberLeaveEvent from '../events/onMemberLeave.ts'
// import type { ClientEvents } from 'discord.js'
// import type { EventModule } from '@/types.d.ts'

const getEventList = () => {
    // type AnyEventModule = {
    //     [K in keyof ClientEvents]: EventModule<K>
    // }[keyof ClientEvents]

    const events = [
        presenceUpdateEvent,
        ReadyEventModule,
        onMemberJoinEvent,
        onMemberLeaveEvent,
    ]

    return events
}

export default getEventList

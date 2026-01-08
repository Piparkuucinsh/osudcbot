import presenceUpdateEvent from '@/events/presenceUpdate'
import ReadyEventModule from '@/events/onReady'
import onMemberJoinEvent from '../events/onMemberJoin'
import onMemberLeaveEvent from '../events/onMemberLeave'
import onMemberBan from '@/events/onMemberBan'
import onMemberUnban from '@/events/onMemberUnban'
import { ClientEvents } from 'discord.js'
import { EventModule } from '@/types'

const getEventList = () => {
    type AnyEventModule = {
        [K in keyof ClientEvents]: EventModule<K>
    }[keyof ClientEvents]

    const events: AnyEventModule[] = [
        presenceUpdateEvent,
        ReadyEventModule,
        onMemberJoinEvent,
        onMemberLeaveEvent,
        onMemberBan,
        onMemberUnban,
    ]

    return events
}

export default getEventList

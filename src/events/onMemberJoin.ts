import { Events, GuildMember } from 'discord.js'
import { EventModule } from '@/types'
import { createPlayer, getPlayer } from '@/lib/db'
import { sendNotifications } from '@/services/discord'
import { error } from '@/lib/log'

const onMemberJoinEvent: EventModule<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    once: false,
    execute: async (member: GuildMember) => {
        try {
            const user = await getPlayer(member.id)
            if (!user) {
                await createPlayer(member.id)
                await sendNotifications(
                    `${member.toString()} pievienojās serverim!`
                )
            } else {
                await sendNotifications(
                    `${member.toString()} atkal pievienojās serverim!`
                )
            }
        } catch (err) {
            error(String(err))
        }
    },
}

export default onMemberJoinEvent

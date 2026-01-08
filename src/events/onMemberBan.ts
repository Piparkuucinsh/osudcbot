import { Events, User } from 'discord.js'
import { EventModule } from '@/types'
import { sendNotifications } from '@/services/discord'
import { error } from '@/lib/log'

const onMemberBan: EventModule<Events.GuildBanAdd> = {
    name: Events.GuildBanAdd,
    once: false,
    execute: async (ban) => {
        try {
            const user = ban.user as User
            await sendNotifications(
                `**${user.username}** ir ticis nobanots no servera!`
            )
        } catch (err) {
            error(String(err))
        }
    },
}

export default onMemberBan

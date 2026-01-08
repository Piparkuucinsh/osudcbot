import { Events } from 'discord.js'
import { EventModule } from '@/types'
import { sendNotifications } from '@/services/discord'
import { error } from '@/lib/log'

const onMemberUnban: EventModule<Events.GuildBanRemove> = {
    name: Events.GuildBanRemove,
    once: false,
    execute: async (ban) => {
        try {
            await sendNotifications(
                `**${ban.user.username}** ir unbanots no servera!`
            )
        } catch (err) {
            error(String(err))
        }
    },
}

export default onMemberUnban

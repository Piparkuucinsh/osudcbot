import { Events, GuildMember, PartialGuildMember } from 'discord.js'
import type { EventModule } from '@/types.d.ts'
import { prisma } from '@/lib/prisma.ts'

const onMemberLeaveEvent: EventModule<Events.GuildMemberRemove> = {
    name: Events.GuildMemberRemove,
    once: false,
    execute: async (member: GuildMember | PartialGuildMember) => {
        try {
            // member.displayName left the server
            // maybe banned?
            await prisma.user.update({
                where: { discord_user_id: member.id },
                data: { in_server: false },
            })
        } catch (err) {
            console.error(err)
        }
    },
}

export default onMemberLeaveEvent

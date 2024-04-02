import { Events, GuildMember } from 'discord.js'
import { EventModule } from '@/types'
import { prisma } from '@/lib/prisma'

const onMemberJoinEvent: EventModule<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    once: false,
    execute: async (member: GuildMember) => {
        try {
            const user = await prisma.user.findFirst({
                where: { discord_user_id: member.id },
            })
            if (user) {
                //send welcome message welcoming back
                await prisma.user.update({
                    where: { discord_user_id: member.id },
                    data: { in_server: true },
                })
            } else {
                //send welcome message
                await prisma.user.create({
                    data: {
                        discord_user_id: member.id,
                        in_server: true,
                    },
                })
            }
        } catch (err) {
            console.error(err)
        }
    },
}

export default onMemberJoinEvent

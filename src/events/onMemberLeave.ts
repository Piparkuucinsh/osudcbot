import { Events, GuildMember, PartialGuildMember } from "discord.js";
import { EventModule } from "@/types";
import { prisma } from "@/lib/prisma";

const presenceUpdateEvent: EventModule<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  once: false,
  execute: async (member: GuildMember | PartialGuildMember) => {
    try {
      // member.displayName left the server
      // maybe banned?
      await prisma.user.update({
        where: { discord_user_id: BigInt(member.id) },
        data: { in_server: false },
      });
    } catch (err) {
      console.error(err);
    }
  },
};

export default presenceUpdateEvent;

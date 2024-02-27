import { Events, GuildMember, PartialGuildMember } from "discord.js";
import { config } from "../config";
import { EventModule } from "types";

const onMemberLeaveEvent: EventModule<Events.GuildMemberRemove> = {
    name: Events.GuildMemberRemove,
    once: false,
    execute: (member: GuildMember | PartialGuildMember) => {
        try {
            // console.log(newPresence);

            console.log(`A member left: ${member.user.tag}`);
            console.log(`Member ID: ${member.id}`);
            console.log(`Left Guild: ${member.guild.name}`);

        } catch (err) {
            console.error(err);
        }
    },
};

export default onMemberLeaveEvent;
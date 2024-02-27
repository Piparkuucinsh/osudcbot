import { Events, GuildMember, PartialGuildMember } from "discord.js";
import { config } from "../config";
import { EventModule } from "types";

const onMemberJoinEvent: EventModule<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    once: false,
    execute: (member: GuildMember | PartialGuildMember) => {
        try {
            // console.log(newPresence);
            console.log(`New member joined: ${member.user.tag}`);
            console.log(`Member ID: ${member.id}`);
            console.log(`Joined Guild: ${member.guild.name}`);

        } catch (err) {
            console.error(err);
        }
    },
};

export default onMemberJoinEvent;

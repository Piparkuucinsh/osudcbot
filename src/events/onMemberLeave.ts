import { Events, type GuildMember, type PartialGuildMember } from "discord.js";
import { error } from "@/lib/log";
import { sendNotifications } from "@/services/discord";
import type { EventModule } from "@/types";

const onMemberLeaveEvent: EventModule<Events.GuildMemberRemove> = {
	name: Events.GuildMemberRemove,
	once: false,
	execute: async (member: GuildMember | PartialGuildMember) => {
		try {
			await sendNotifications(`**${member.displayName}** izgāja no servera!`);
			await sendNotifications("https://tenor.com/view/rip-bozo-gif-22294771");
		} catch (err) {
			error(String(err));
		}
	},
};

export default onMemberLeaveEvent;

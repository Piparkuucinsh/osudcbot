import { Events, type User } from "discord.js";
import { error } from "@/lib/log";
import { sendNotifications } from "@/services/discord";
import type { EventModule } from "@/types";

const onMemberBan: EventModule<Events.GuildBanAdd> = {
	name: Events.GuildBanAdd,
	once: false,
	execute: async (ban) => {
		try {
			const user = ban.user as User;
			await sendNotifications(
				`**${user.username}** ir ticis nobanots no servera!`,
			);
		} catch (err) {
			error(String(err));
		}
	},
};

export default onMemberBan;

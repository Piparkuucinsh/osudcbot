import type { ClientEvents } from "discord.js";
import onMemberBan from "@/events/onMemberBan";
import onMemberUnban from "@/events/onMemberUnban";
import ReadyEventModule from "@/events/onReady";
import presenceUpdateEvent from "@/events/presenceUpdate";
import type { EventModule } from "@/types";
import onMemberJoinEvent from "../events/onMemberJoin";
import onMemberLeaveEvent from "../events/onMemberLeave";

const getEventList = () => {
	type AnyEventModule = {
		[K in keyof ClientEvents]: EventModule<K>;
	}[keyof ClientEvents];

	const events: AnyEventModule[] = [
		presenceUpdateEvent,
		ReadyEventModule,
		onMemberJoinEvent,
		onMemberLeaveEvent,
		onMemberBan,
		onMemberUnban,
	];

	return events;
};

export default getEventList;

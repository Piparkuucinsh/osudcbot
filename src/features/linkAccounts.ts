import type { Activity, GuildMember, Presence } from "discord.js";
import { config } from "@/init/config";
import {
	clearPlayerOsuId,
	getPlayer,
	getPlayerByOsuId,
	listLinkedPlayers,
	setPlayerOsuId,
} from "@/lib/db";
import { error, warn } from "@/lib/log";
import { sendBotChannel } from "@/services/discord";
import { getOsuUserByUsername } from "@/services/osu";

const OSU_APP_ID = "367827983903490050";
const alreadySent = new Set<string>();

export const linkAccounts = async (presence: Presence): Promise<void> => {
	if (!presence.member || !presence.activities) return;

	for (const activity of presence.activities) {
		if (activity.applicationId === OSU_APP_ID) {
			try {
				await handleOsuActivity(activity, presence.member);
			} catch (err) {
				error(`Error processing osu! activity: ${String(err)}`);
				warn("Error in linkAccounts");
			}
		}
	}
};

async function handleOsuActivity(
	activity: Activity,
	member: GuildMember,
): Promise<void> {
	const username = extractUsernameFromActivity(activity);
	if (!username) return;

	const osuUser = await getOsuUserByUsername(username);
	if (!osuUser) {
		return;
	}

	const countryCode = osuUser.country_code ?? osuUser.country?.code;

	if (countryCode !== "LV") {
		await handleNonLatvianUser(member);
		return;
	}

	await linkLatvianUser(member, osuUser.id, osuUser.username);
}

function extractUsernameFromActivity(activity: Activity): string | null {
	const largeText = activity.assets?.largeText;
	if (!largeText) return null;

	const username = largeText.split("(", 1)[0].trim();
	if (username.length === 0 || username === largeText) {
		return null;
	}
	return username;
}

async function handleNonLatvianUser(member: GuildMember): Promise<void> {
	const roleId = config.roles.immigrant;
	if (!roleId) return;

	const hasRole = member.roles.cache.has(roleId);
	if (hasRole) return;

	const role = member.guild.roles.cache.get(roleId);
	if (!role) {
		throw new Error(`Role ${roleId} not found in guild`);
	}
	await member.roles.add(role);
	await sendBotChannel(
		`Lietotājs ${member.toString()} nav no Latvijas! (Pievienots imigranta role)`,
	);
}

async function linkLatvianUser(
	member: GuildMember,
	osuId: number,
	osuUsername: string,
): Promise<void> {
	const player = await getPlayer(member.id);
	if (!player) {
		warn(`link_user: discord member ${member.id} not in db`);
		return;
	}

	if (!player.osu_id) {
		const existingByOsu = await getPlayerByOsuId(osuId);
		if (!existingByOsu) {
			await setPlayerOsuId(member.id, osuId);
			await sendBotChannel(
				`Pievienoja ${member.toString()} datubāzei ar osu! kontu ${osuUsername} (id: ${osuId})`,
			);
			await postLinkedUsersIfConfigured();
			return;
		}

		if (existingByOsu.discord_id !== member.id) {
			await setPlayerOsuId(member.id, osuId);
			await clearPlayerOsuId(existingByOsu.discord_id);
			await sendBotChannel(
				`Lietotājs ${member.toString()} spēlē uz osu! konta (id: ${osuId}), kas linkots ar <@${existingByOsu.discord_id}>. Vecais konts unlinkots un linkots jaunais.`,
			);
			await postLinkedUsersIfConfigured();
			return;
		}
	} else if (player.osu_id !== osuId) {
		const key = `${osuId}:${player.osu_id}`;
		if (!alreadySent.has(key)) {
			await sendBotChannel(
				`Lietotājs ${member.toString()} jau eksistē ar osu! id ${player.osu_id}, bet pašlaik spēlē uz cita osu! konta ar id = ${osuId} username = ${osuUsername}.`,
			);
			alreadySent.add(key);
		}
	}
}

async function postLinkedUsersIfConfigured(): Promise<void> {
	const url = config.postRequest?.url;
	const token = config.postRequest?.token;
	if (!url || !token) return;

	try {
		const result = await listLinkedPlayers();
		const payload = {
			users: result.map((row) => ({
				discord_id: row.discord_id,
				osu_id: String(row.osu_id),
			})),
		};

		const resp = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify(payload),
		});

		if (!resp.ok) {
			warn(
				`${resp.status}: failed to post ${result.length} users to post_request_url`,
			);
		}
	} catch (error) {
		warn(`error in posting users to post_request_url: ${String(error)}`);
	}
}

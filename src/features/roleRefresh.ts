import type { GuildMember } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { guild } from "@/index";
import { config } from "@/init/config";
import { listLinkedPlayers } from "@/lib/db";
import { warn } from "@/lib/log";
import { getRankRoleByRank, getRankRoleThreshold } from "@/lib/roles";
import { getGuildMember, getRole, sendBotSpam } from "@/services/discord";
import { getOsuUserById, getRankingLV } from "@/services/osu";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

let refreshTimer: NodeJS.Timeout | null = null;

type RankStatus =
	| {
			type: "ranked";
			rank: number;
			user: Awaited<ReturnType<typeof getOsuUserById>>;
	  }
	| { type: "restricted"; user: Awaited<ReturnType<typeof getOsuUserById>> }
	| { type: "inactive"; user: Awaited<ReturnType<typeof getOsuUserById>> };

type MemberRoleOps = Pick<GuildMember, "roles">;

const MESSAGE_CONFIG = {
	no_previous_role: {
		color: 0x14d121,
		text: (roleName: string) => `ir grupā **${roleName}**!`,
	},
	pacelas: {
		color: 0x14d121,
		text: (roleName: string) => `pakāpās uz grupu **${roleName}**!`,
	},
	nokritas: {
		color: 0xc41009,
		text: (roleName: string) => `nokritās uz grupu **${roleName}**!`,
	},
	restricted: {
		color: 0x7b5c00,
		text: () => "ir kļuvis restricted!",
	},
	inactive: {
		color: 0x696969,
		text: () => "ir kļuvis inactive!",
	},
	unrestricted: {
		color: 0x14d121,
		text: () => "ir kļuvis unrestrictots!",
	},
} as const;

export const startRoleRefreshLoop = (): void => {
	if (refreshTimer) return;
	refreshTimer = setInterval(() => {
		void refreshRoles();
	}, REFRESH_INTERVAL_MS);
};

export const stopRoleRefreshLoop = (): void => {
	if (refreshTimer) {
		clearInterval(refreshTimer);
		refreshTimer = null;
	}
};

export const refreshRoles = async (): Promise<void> => {
	try {
		const ranking = await getRankingLV();
		const rankingIndex = new Map<number, number>();
		ranking.forEach((entry, idx) => {
			rankingIndex.set(entry.user.id, idx + 1);
		});

		const linkedPlayers = await listLinkedPlayers();
		for (const player of linkedPlayers) {
			const member = await getGuildMember(player.discord_id);
			if (!member) continue;

			const roleIds = member.roles.cache.map((r) => r.id);
			const status = await resolveRankStatus(player.osu_id, rankingIndex);
			if (!status) continue;

			await applyRoleStatus(member, roleIds, status, player.osu_id);
		}
	} catch (error) {
		warn(`error in refreshRoles: ${String(error)}`);
	}
};

const resolveRankStatus = async (
	osuId: number,
	rankingIndex: Map<number, number>,
): Promise<RankStatus | null> => {
	if (rankingIndex.has(osuId)) {
		const rank = rankingIndex.get(osuId) ?? -1;
		if (rank > 0) {
			return { type: "ranked", rank, user: null };
		}
	}

	const osuUser = await getOsuUserById(osuId);
	if (!osuUser) {
		const peppy = await getOsuUserById(2);
		if (!peppy) {
			warn("osu api appears down; skipping restricted assignment");
			return null;
		}
		return { type: "restricted", user: null };
	}

	if (osuUser.statistics && osuUser.statistics.is_ranked === false) {
		return { type: "inactive", user: osuUser };
	}

	const rank = osuUser.statistics?.country_rank ?? Number.MAX_SAFE_INTEGER;
	return { type: "ranked", rank, user: osuUser };
};

const applyRoleStatus = async (
	member: MemberRoleOps,
	roleIds: string[],
	status: RankStatus,
	osuId: number,
): Promise<void> => {
	const currentRankKey = findCurrentRankRoleKey(roleIds);
	const currentSpecial = findCurrentSpecialRole(roleIds);

	if (status.type === "restricted" || status.type === "inactive") {
		const targetSpecial = status.type;
		if (currentSpecial === targetSpecial) return;

		await removeCurrentRoles(member, currentRankKey, currentSpecial);
		await addSpecialRole(member, targetSpecial);
		await sendRoleChangeMessage(status.type, osuId, status.user);
		return;
	}

	const targetRankKey = getRankRoleByRank(status.rank);

	if (!currentRankKey && !currentSpecial) {
		await addRankRole(member, targetRankKey);
		await sendRoleChangeMessage(
			"no_previous_role",
			osuId,
			status.user,
			targetRankKey,
		);
		return;
	}

	if (currentSpecial) {
		await removeCurrentRoles(member, currentRankKey, currentSpecial);
		await addRankRole(member, targetRankKey);
		if (currentSpecial === "restricted") {
			await sendRoleChangeMessage("unrestricted", osuId, status.user);
		} else {
			await sendRoleChangeMessage(
				"no_previous_role",
				osuId,
				status.user,
				targetRankKey,
			);
		}
		return;
	}

	if (currentRankKey === targetRankKey) return;

	if (!currentRankKey) return;
	const currentValue = getRankRoleThreshold(currentRankKey);
	const newValue = getRankRoleThreshold(targetRankKey);
	const messageKind = newValue < currentValue ? "pacelas" : "nokritas";

	await removeCurrentRoles(member, currentRankKey, currentSpecial);
	await addRankRole(member, targetRankKey);
	await sendRoleChangeMessage(messageKind, osuId, status.user, targetRankKey);
};

const findCurrentRankRoleKey = (roleIds: string[]): string | null => {
	for (const [key, role] of Object.entries(config.rankRoles)) {
		if (roleIds.includes(role.id)) {
			return key;
		}
	}
	return null;
};

const findCurrentSpecialRole = (
	roleIds: string[],
): "restricted" | "inactive" | null => {
	if (roleIds.includes(config.roles.restricted)) return "restricted";
	if (roleIds.includes(config.roles.inactive)) return "inactive";
	return null;
};

const removeCurrentRoles = async (
	member: MemberRoleOps,
	currentRankKey: string | null,
	currentSpecial: "restricted" | "inactive" | null,
): Promise<void> => {
	if (currentRankKey) {
		const roleId = config.rankRoles[currentRankKey].id;
		const role = await getRole(roleId);
		if (role) {
			await member.roles.remove(role);
		}
	}

	if (currentSpecial) {
		const roleId =
			currentSpecial === "restricted"
				? config.roles.restricted
				: config.roles.inactive;
		const role = await getRole(roleId);
		if (role) {
			await member.roles.remove(role);
		}
	}
};

const addRankRole = async (
	member: MemberRoleOps,
	rankKey: string,
): Promise<void> => {
	const roleId = config.rankRoles[rankKey].id;
	const role = await getRole(roleId);
	if (role) {
		await member.roles.add(role);
	}
};

const addSpecialRole = async (
	member: MemberRoleOps,
	special: "restricted" | "inactive",
): Promise<void> => {
	const roleId =
		special === "restricted" ? config.roles.restricted : config.roles.inactive;
	const role = await getRole(roleId);
	if (role) {
		await member.roles.add(role);
	}
};

const sendRoleChangeMessage = async (
	kind: keyof typeof MESSAGE_CONFIG,
	osuId: number,
	osuUser: Awaited<ReturnType<typeof getOsuUserById>>,
	rankRoleKey?: string,
): Promise<void> => {
	const roleName = rankRoleKey ? await getRoleName(rankRoleKey) : "??";
	const messageConfig = MESSAGE_CONFIG[kind];
	const description = messageConfig.text(roleName);
	const color = messageConfig.color;

	if (!osuUser) {
		osuUser = await getOsuUserById(osuId);
	}

	const embed = new EmbedBuilder().setDescription(description).setColor(color);

	if (osuUser) {
		embed.setAuthor({
			name: osuUser.username,
			url: `https://osu.ppy.sh/users/${osuUser.id}`,
			iconURL: osuUser.avatar_url,
		});
	}

	await sendBotSpam({ embeds: [embed] });
};

const getRoleName = async (key: string): Promise<string> => {
	const roleId = config.rankRoles[key].id;
	if (!guild) return roleId;
	const role = await getRole(roleId);
	return role?.name ?? roleId;
};

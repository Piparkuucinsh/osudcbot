import * as osu from "osu-api-v2-js";
import { getOsuApi } from "@/init/init_osu_client";
import { warn } from "@/lib/log";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetries = async <T>(
	fn: () => Promise<T>,
	label: string,
	attempts = 3,
	delayMs = 800,
): Promise<T | null> => {
	let lastError: unknown = null;
	for (let i = 0; i < attempts; i += 1) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			if (i < attempts - 1) {
				await sleep(delayMs);
			}
		}
	}
	warn(`osu api error: ${label} failed: ${String(lastError)}`);
	return null;
};

export const getOsuUserByUsername = async (username: string) => {
	const result = await withRetries(
		() => getOsuApi().getUser(username),
		`user.get(${username})`,
	);
	if (!result) {
		warn(`osu api returned error for user.get(${username})`);
		return null;
	}
	return result;
};

export const getOsuUserById = async (osuId: number) => {
	const result = await withRetries(
		() => getOsuApi().getUser(osuId),
		`user.get(${osuId})`,
	);
	if (!result) {
		warn(`osu api returned error for user.get(${osuId})`);
		return null;
	}
	return result;
};

export const getRankingLV = async () => {
	const combined: osu.User.Statistics.WithUser[] = [];
	for (let page = 1; page <= 20; page += 1) {
		const resp = await withRetries(
			() =>
				getOsuApi().getUserRanking(osu.Ruleset.osu, "performance", {
					country: "LV",
					page,
				}),
			`ranking.details(page=${page})`,
		);
		if (!resp) {
			warn(`osu api returned error for ranking page ${page}`);
			break;
		}
		const ranking = resp.ranking ?? [];
		combined.push(...ranking);
		if (ranking.length === 0) break;
	}
	return combined;
};

export const getUserBestScores = async (userId: number, limit: number) => {
	const result = await withRetries(
		() =>
			getOsuApi().getUserScores(
				userId,
				"best",
				osu.Ruleset.osu,
				{ fails: false, lazer: false },
				{ limit },
			),
		`scores.best(${userId})`,
	);

	if (!result) {
		warn(`osu api returned error for user_best ${userId}`);
		return null;
	}

	return result;
};

import * as osu from "osu-api-v2-js";
import { getOsuApi } from "@/init/init_osu_client";
import { warn } from "@/lib/log";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isNotFoundError = (error: unknown): boolean => {
	const responseStatusCode = (error as { response?: { status_code?: number } })
		.response?.status_code;
	if (responseStatusCode === 404) {
		return true;
	}

	if (error instanceof Error) {
		return error.message.toLowerCase() === "not found";
	}
	return String(error).toLowerCase() === "error: not found";
};

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
			if (isNotFoundError(error)) {
				break;
			}
			if (i < attempts - 1) {
				await sleep(delayMs);
			}
		}
	}
	if (!isNotFoundError(lastError)) {
		warn(`osu api error: ${label} failed: ${String(lastError)}`);
	}
	return null;
};

export const getOsuUserByUsername = async (
	username: string,
	ruleset = osu.Ruleset.osu,
) => {
	const result = await withRetries(
		() => getOsuApi().getUser(username, ruleset),
		`user.get(${username}, ruleset=${ruleset})`,
	);
	if (!result) {
		return null;
	}
	return result;
};

export const getOsuUserById = async (
	osuId: number,
	ruleset = osu.Ruleset.osu,
) => {
	const result = await withRetries(
		() => getOsuApi().getUser(osuId, ruleset),
		`user.get(${osuId}, ruleset=${ruleset})`,
	);
	if (!result) {
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
		return null;
	}

	return result;
};

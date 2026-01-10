import dotenv from "dotenv";
import * as osu from "osu-api-v2-js";
import { info } from "@/lib/log";

dotenv.config();

let api: osu.API | null = null;

export const osu_login = async () => {
	const client_id = Number(process.env.OSU_CLIENT_ID);
	const secret_key = process.env.OSU_CLIENT_SECRET;
	if (!client_id || !secret_key) {
		throw new Error("Missing OSU_CLIENT_ID or OSU_CLIENT_SECRET");
	}

	api = await osu.API.createAsync(client_id, secret_key);
	api.retry_maximum_amount = 3;
	api.retry_delay = 2;
	api.retry_on_timeout = true;
	api.retry_on_status_codes = [429, 500, 502, 503, 504];
	api.refresh_token_on_401 = true;
	api.retry_on_automatic_token_refresh = true;
	info("osu! client logged in");
};

export const getOsuApi = (): osu.API => {
	if (!api) {
		throw new Error("osu api not initialized");
	}
	return api;
};

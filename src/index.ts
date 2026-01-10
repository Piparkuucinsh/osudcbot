import "dotenv/config";
import type { Client, Guild } from "discord.js";
import { config } from "@/init/config";
import { init_dc_client } from "@/init/init_dc_client";
import { osu_login } from "@/init/init_osu_client";
import { closeDb, initDb } from "@/lib/db";

osu_login()
	.then()
	.catch((err) => {
		throw err;
	});
export let client: Client;
export let guild: Guild;

const boot = async () => {
	await initDb();
	const cl = await init_dc_client();
	client = cl;
	guild = await client.guilds.fetch(config.discord.serverId);
};

void boot();

process.on("SIGINT", async () => {
	await closeDb();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await closeDb();
	process.exit(0);
});

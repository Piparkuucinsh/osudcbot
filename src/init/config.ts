import { readFileSync } from "node:fs";
import { z } from "zod";

const rankRoleSchema = z.object({
	id: z.string().min(1),
	threshold: z.number().int().positive(),
	userNewBestLimit: z.number().int().positive(),
});

const configSchema = z.object({
	discord: z.object({
		serverId: z.string().min(1),
		botChannelId: z.string().min(1),
		botSpamChannelId: z.string().min(1),
		notificationsChannelId: z.string().min(1),
	}),
	roles: z.object({
		restricted: z.string().min(1),
		inactive: z.string().min(1),
		immigrant: z.string().min(1),
		pervert: z.string().min(1),
		admin: z.string().min(1),
	}),
	rankRoles: z
		.record(z.string(), rankRoleSchema)
		.refine((value) => Object.keys(value).length > 0, {
			message: "rankRoles must not be empty",
		}),
	rankEmojis: z.record(z.string(), z.string()).default({}),
	postRequest: z
		.object({
			url: z.string().optional(),
			token: z.string().optional(),
		})
		.default({}),
});

const configFileContent = readFileSync("config.json", "utf8");

const parsed = (() => {
	try {
		return JSON.parse(configFileContent);
	} catch {
		throw new Error("Error parsing config file.");
	}
})();

export const config = configSchema.parse(parsed);

export type BotConfig = z.infer<typeof configSchema>;
export type RankRoleKey = string;
export type RankRoleConfig = z.infer<typeof rankRoleSchema>;

import {
	ChannelType,
	type GuildMember,
	type MessageCreateOptions,
	type Role,
} from "discord.js";
import { client, guild } from "@/index";
import { config } from "@/init/config";
import {
	describeDiscordMessage,
	dryRunLog,
	isDryRun,
} from "@/lib/dryRun";

export const getGuildMember = async (
	discordId: string,
): Promise<GuildMember | null> => {
	try {
		const member =
			guild.members.cache.get(discordId) ??
			(await guild.members.fetch(discordId));
		return member ?? null;
	} catch {
		return null;
	}
};

export const getRole = async (roleId: string): Promise<Role | null> => {
	try {
		const role =
			guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId));
		return role ?? null;
	} catch {
		return null;
	}
};

export const sendBotChannel = async (
	message: string | MessageCreateOptions,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.channel.send.bot", {
			channelId: config.discord.botChannelId,
			message: describeDiscordMessage(message),
		});
		return;
	}
	const channel = await client.channels.fetch(config.discord.botChannelId);
	if (channel && channel.type === ChannelType.GuildText) {
		await channel.send(message);
	}
};

export const sendBotSpam = async (
	message: string | MessageCreateOptions,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.channel.send.botspam", {
			channelId: config.discord.botSpamChannelId,
			message: describeDiscordMessage(message),
		});
		return;
	}
	const channel = await client.channels.fetch(config.discord.botSpamChannelId);
	if (channel && channel.type === ChannelType.GuildText) {
		await channel.send(message);
	}
};

export const sendNotifications = async (
	message: string | MessageCreateOptions,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.channel.send.notifications", {
			channelId: config.discord.notificationsChannelId,
			message: describeDiscordMessage(message),
		});
		return;
	}
	const channel = await client.channels.fetch(
		config.discord.notificationsChannelId,
	);
	if (channel && channel.type === ChannelType.GuildText) {
		await channel.send(message);
	}
};

import type {
	ChatInputCommandInteraction,
	Collection,
	GuildMember,
	Message,
	MessageCreateOptions,
	Role,
} from "discord.js";

export const isDryRun = process.env.BOT_REAL_RUN !== "1";

const serialize = (value: unknown): string => {
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value, (_key, innerValue) => {
			if (typeof innerValue === "bigint") return innerValue.toString();
			return innerValue;
		});
	} catch {
		return String(value);
	}
};

export const dryRunLog = (action: string, details: unknown): void => {
	console.log(`[DRY_RUN] ${action}: ${serialize(details)}`);
};

export const describeDiscordMessage = (
	message: string | MessageCreateOptions,
): unknown => {
	if (typeof message === "string") return { content: message };
	return {
		content: message.content,
		embeds: message.embeds?.map((embed) =>
			"toJSON" in embed ? embed.toJSON() : embed,
		),
	};
};

export const maybeReply = async (
	interaction: ChatInputCommandInteraction,
	payload: string | object,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.interaction.reply", {
			command: interaction.commandName,
			channelId: interaction.channelId,
			payload,
		});
		return;
	}
	await interaction.reply(payload as Parameters<typeof interaction.reply>[0]);
};

export const maybeDeferReply = async (
	interaction: ChatInputCommandInteraction,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.interaction.deferReply", {
			command: interaction.commandName,
			channelId: interaction.channelId,
		});
		return;
	}
	await interaction.deferReply();
};

export const maybeEditReply = async (
	interaction: ChatInputCommandInteraction,
	payload: string | object,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.interaction.editReply", {
			command: interaction.commandName,
			channelId: interaction.channelId,
			payload,
		});
		return;
	}
	await interaction.editReply(payload as Parameters<typeof interaction.editReply>[0]);
};

export const maybeFollowUp = async (
	interaction: ChatInputCommandInteraction,
	payload: string | object,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.interaction.followUp", {
			command: interaction.commandName,
			channelId: interaction.channelId,
			payload,
		});
		return;
	}
	await interaction.followUp(payload as Parameters<typeof interaction.followUp>[0]);
};

export const maybeAddRole = async (
	member: Pick<GuildMember, "id" | "roles">,
	role: Role,
	reason?: string,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.member.roles.add", {
			discordId: member.id,
			roleId: role.id,
			roleName: role.name,
			reason,
		});
		return;
	}
	await member.roles.add(role);
};

export const maybeRemoveRole = async (
	member: Pick<GuildMember, "id" | "roles">,
	role: Role | Collection<string, Role>,
	reason?: string,
): Promise<void> => {
	if (isDryRun) {
		dryRunLog("discord.member.roles.remove", {
			discordId: member.id,
			roles:
				"id" in role
					? [{ roleId: role.id, roleName: role.name }]
					: role.map((r) => ({ roleId: r.id, roleName: r.name })),
			reason,
		});
		return;
	}
	await member.roles.remove(role);
};

export const maybeDeleteMessage = async (message: Message): Promise<boolean> => {
	if (isDryRun) {
		dryRunLog("discord.message.delete", {
			messageId: message.id,
			channelId: message.channelId,
			authorId: message.author.id,
			content: message.content,
		});
		return true;
	}
	await message.delete();
	return true;
};

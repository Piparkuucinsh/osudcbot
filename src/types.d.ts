import {
	ClientEvents,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

export type EventModule<K extends keyof ClientEvents> = {
	name: K;
	once: boolean;
	execute: (...args: ClientEvents[K]) => void;
};

export type CommandModule = {
	data:
		| SlashCommandBuilder
		| import("discord.js").SlashCommandOptionsOnlyBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

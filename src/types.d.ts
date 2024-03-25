import {
    ClientEvents,
    CommandInteraction,
    SlashCommandBuilder,
} from "discord.js";

export type EventModule<K extends keyof ClientEvents> = {
    name: K;
    once: boolean;
    execute: (...args: ClientEvents[K]) => void;
};

export type CommandModule = {
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
    execute: (interaction: CommandInteraction) => Promise<void>;
};

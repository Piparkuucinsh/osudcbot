import { ClientEvents } from "discord.js";

export type EventModule<K extends keyof ClientEvents> = {
  name: K;
  once: boolean;
  execute: (...args: ClientEvents[K]) => void;
};
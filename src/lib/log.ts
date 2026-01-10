import { logWarning } from "@/lib/discordLogHandler";

export const info = (message: string): void => {
	console.log(message);
};

export const warn = (message: string): void => {
	console.warn(message);
	logWarning(message);
};

export const error = (message: string): void => {
	console.error(message);
	logWarning(message);
};

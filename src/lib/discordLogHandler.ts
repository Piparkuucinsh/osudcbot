import { sendBotChannel } from "@/services/discord";

const queue: string[] = [];
let running = false;

export const logWarning = (message: string): void => {
	queue.push(message);
	if (!running) {
		running = true;
		void flushLoop();
	}
};

const flushLoop = async (): Promise<void> => {
	while (queue.length > 0) {
		const batch = queue.splice(0, 10);
		for (const msg of batch) {
			const trimmed = msg.length > 1990 ? `${msg.slice(0, 1987)}...` : msg;
			await sendBotChannel(`\`\`\`\n${trimmed}\n\`\`\``);
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	running = false;
};

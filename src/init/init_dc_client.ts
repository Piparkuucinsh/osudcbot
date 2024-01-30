import { Client, ClientEvents, GatewayIntentBits } from "discord.js";
import { EventModule } from "types";
import path from "path";

import presenceUpdateEvent from "../events/presenceUpdate";
import ReadyEventModule from "../events/ready";

const ROOT_PATH = path.join(process.cwd(), "dist");
console.log(ROOT_PATH);

export const init_dc_client = async () => {
  const discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
    ],
  });

  await discordClient.login(process.env.BOT_TOKEN);

  try {
    type AnyEventModule = {
      [K in keyof ClientEvents]: EventModule<K>;
    }[keyof ClientEvents];

    const events: AnyEventModule[] = [presenceUpdateEvent, ReadyEventModule];

    for (const event of events as EventModule<keyof ClientEvents>[]) {
      if (event.once) {
        discordClient.once(
          event.name,
          (...args: ClientEvents[typeof event.name]) => event.execute(...args),
        );
      } else {
        discordClient.on(
          event.name,
          (...args: ClientEvents[typeof event.name]) => event.execute(...args),
        );
      }
    }
  } catch (error) {
    console.error("Failed to set up Discord client events:");
    throw error;
  }

  return discordClient;
};
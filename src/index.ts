import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import "dotenv/config";
import { readdirSync } from "fs";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});


// client.once(Events.ClientReady, async (c) => {
//   console.log(`Ready! Logged in as ${c.user.tag}`);
//   if (process.env.OSU_CLIENT_ID && process.env.OSU_CLIENT_SECRET) {
//     await auth.login(
//       Number(process.env.OSU_CLIENT_ID),
//       process.env.OSU_CLIENT_SECRET,
//       ["public"]
//     );
//   } else {
//     throw new Error("Missing osu api credentials in env");
//   }
// });

const eventsPath = path.join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((file) =>
  file.endsWith(".ts")
);
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN);

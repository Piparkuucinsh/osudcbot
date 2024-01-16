import { readFileSync } from "fs";

export type Config = {
  server_id: string;
  bot_channel_id: string;
};

const configFileContent = readFileSync("config.json", "utf8");

let parsedConfig: any;

try {
  parsedConfig = JSON.parse(configFileContent);
} catch {
  throw new Error("Error parsing config file.");
}

export const config: Config = validateConfig(parsedConfig);

function validateConfig(config: any): Config {
  if (!config.server_id) {
    throw new Error("Missing server_id in the config file");
  }
  if (!config.bot_channel_id) {
    throw new Error("Missing bot_channel_id in the config file");
  }
  return config as Config;
}

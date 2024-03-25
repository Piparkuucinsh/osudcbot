import { config } from "@/config";
import { ChannelType, MessageCreateOptions, MessagePayload } from "discord.js";
import { client } from "@/index";

export const sendBotMessage = async (
  msg: string | MessagePayload | MessageCreateOptions,
) => {
  const ctx = await client.channels.fetch(config.bot_channel_id);
  if (ctx && ctx.type === ChannelType.GuildText) {
    await ctx.send(msg);
  }
};

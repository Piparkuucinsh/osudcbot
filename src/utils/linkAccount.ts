import { v2 } from "osu-api-extended";
import { prisma } from "@/lib/prisma";
import { sendBotMessage } from "@/utils/sendBotMessage";
import { Presence } from "discord.js";

const OSU_APP_ID = "367827983903490050";

export const linkAccounts = async (presence: Presence) => {
  try {
    const member = presence.member;
    if (!member) return;
    const activities = presence.activities;
    for (const activity of activities) {
      if (activity.applicationId !== OSU_APP_ID) return;

      const username = activity.state?.split("(", 1)[0].trim();
      if (!username || username === activity.state) return;

      const osuUserFromAPI = await v2.user.details(username, "osu");

      if (!osuUserFromAPI) return;

      const osuUserFromDB = await prisma.osuUser.findUnique({
        where: {
          id: Number(osuUserFromAPI.id),
        },
        include: {
          User: true,
        },
      });

      // check for multiacc
      if (
        osuUserFromDB &&
        osuUserFromDB.User &&
        Number(osuUserFromDB.User.discord_user_id) !== Number(member.id)
      ) {
        //unlink osuser from user and link to correct user
        console.log("MULTIACCOUNT!!");
        return;
      }

      //link user or create if doesnt exist
      await prisma.user.upsert({
        where: { discord_user_id: BigInt(member.id) },
        update: { osu_user_id: osuUserFromAPI.id },
        create: {
          discord_user_id: BigInt(member.id),
          osu_user_id: osuUserFromAPI.id,
        },
      });

      const isFromLatvia = osuUserFromAPI.country.code === "LV" ? true : false;

      await prisma.osuUser.upsert({
        where: { id: osuUserFromAPI.id },
        update: { enabled: isFromLatvia },
        create: {
          id: osuUserFromAPI.id,
          username: osuUserFromAPI.username,
          enabled: isFromLatvia,
        },
      });
    }
  } catch (error) {
    console.error(error);
    await sendBotMessage("error in link_acc");
  }
};

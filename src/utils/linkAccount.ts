import { v2 } from "../../node_modules/osu-api-extended/dist/index";
import { prisma } from "../lib/prisma";
import { sendBotMessage } from "./sendBotMessage";
import { Presence } from "discord.js";

const OSU_APP_ID = "367827983903490050";

export const linkAccounts = async (presence: Presence) => {
    try {
        const member = presence.member;
        if (!member) return;
        const activities = presence.activities;
        // console.log("Activities: ", activities)
        for (const activity of activities) {
            if (activity.applicationId !== OSU_APP_ID) {
                console.log("Not osu activity")
                continue;
            }

            const username = activity.assets?.largeText!.split("(", 1)[0].trim();

            if (!username || username != activity.assets?.largeText)
            {
                console.log("Usernames dont match")
                console.log(username)
                console.log(activity.assets?.largeText)
                return;
            }

            const osuUserFromAPI = await v2.user.details(username, "osu");

            if (!osuUserFromAPI)
            {
                console.log("No user found")
                return;
            }

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
            
            const isFromLatvia = osuUserFromAPI.country.code === "LV" ? true : false;
            await prisma.osuUser.upsert({
                where: { id: osuUserFromAPI.id },
                update: { enabled: isFromLatvia },
                create: {
                    id: osuUserFromAPI.id,
                    username: osuUserFromAPI.username,
                    pp_score: osuUserFromAPI.statistics.pp,
                    enabled: isFromLatvia,
                },
            });
            //link user or create if doesnt exist
            await prisma.user.upsert({
                where: { discord_user_id: BigInt(member.id) },
                update: { osu_user_id: osuUserFromAPI.id },
                create: {
                    discord_user_id: BigInt(member.id),
                    osu_user_id: osuUserFromAPI.id,
                },
            });
            console.log("Linked account")

        }
    } catch (error) {
        console.error(error);
        await sendBotMessage("error in link_acc");
    }
};

import { v2 as osuApi } from "../../node_modules/osu-api-extended/dist/index";
import { prisma } from "../lib/prisma";
import { sendBotMessage } from "./sendBotMessage";
import { Guild, GuildMember, Presence } from "discord.js";

const OSU_APP_ID = "367827983903490050";

export const linkAccounts = async (presence: Presence): Promise<void> => {
    if (!presence.member || !presence.activities) return;

    for (const activity of presence.activities) {
        if (activity.applicationId === OSU_APP_ID) {
            console.log("osu! activity detected")
            try {
                await handleOsuActivity(activity, presence.member);
            } catch (error) {
                console.error("Error processing osu! activity:", error);
                await sendBotMessage("Error in linkAccounts");
            }
        }
    }
};

async function handleOsuActivity(activity: any, member: GuildMember): Promise<void> {
    const username = extractUsernameFromActivity(activity);
    console.log("Username:", username)
    if (!username) return;

    const osuUser = await osuApi.user.details(username, "osu");
    if (!osuUser) {
        console.log("No osu! user found for username:", username);
        return;
    }
    console.log("Updating user in database")
    await updateOsuUserInDatabase(osuUser, member);
}

function extractUsernameFromActivity(activity: any): string | null {
    const largeText = activity.assets?.largeText;
    console.log("Large text:", largeText)
    if (!largeText) return null;

    const username = largeText.split("(", 1)[0].trim();
    return largeText
    // return username === largeText ? null : username;
}

async function updateOsuUserInDatabase(osuUser: any, member: GuildMember): Promise<void> {
    const isFromLatvia = osuUser.country.code === "LV";
    console.log("Updating user in database")
    await prisma.osuUser.upsert({
        where: { id: osuUser.id },
        update: { enabled: isFromLatvia },
        create: {
            id: osuUser.id,
            username: osuUser.username,
            pp_score: osuUser.statistics.pp,
            enabled: isFromLatvia,
        },
    });
    console.log("Updating user stats in database")
    await updateOsuStats(osuUser);

    await prisma.user.upsert({
        where: { discord_user_id: BigInt(member.id) },
        update: { osu_user_id: osuUser.id },
        create: {
            discord_user_id: BigInt(member.id),
            osu_user_id: osuUser.id,
        },
    });

    console.log(`Account linked for user: ${member.id}`);
}

async function updateOsuStats(osuUser: any): Promise<void> {
    const stats = extractStats(osuUser);
    console.log(stats)
    for (const stat of stats) {
        await prisma.osuStats.upsert({
            where: { user_id_stat_name: { user_id: osuUser.id, stat_name: stat.name } },
            update: { stat_value: stat.value, last_updated: new Date() },
            create: {
                user_id: osuUser.id,
                stat_name: stat.name,
                stat_value: stat.value,
                last_updated: new Date(),
            },
        });
    }
}

function extractStats(osuUser: any): Array<{ name: string, value: string }> {
    const statistics = [
        { name: 'pp_score', value: osuUser.statistics.pp?.toString() || "N/A" },
        { name: 'accuracy', value: osuUser.statistics.hit_accuracy?.toString() || "N/A" },
        { name: 'play_count', value: osuUser.statistics.play_count?.toString() || "N/A" },
        { name: 'total_score', value: osuUser.statistics.total_score?.toString() || "N/A" },
        { name: 'ranked_score', value: osuUser.statistics.ranked_score?.toString() || "N/A" },
        { name: 'level', value: osuUser.statistics.level.current?.toString() || "N/A" },
        { name: 'global_rank', value: osuUser.statistics.global_rank?.toString() || "N/A" },
        { name: 'country_rank', value: osuUser.statistics.country_rank?.toString() || "N/A" },
        { name: 'highest_rank', value: osuUser.rank_highest?.rank?.toString() || "N/A" },
    ];
    return statistics;
}
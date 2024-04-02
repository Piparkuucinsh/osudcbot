import { v2 as osuApi } from 'osu-api-extended'
import { prisma } from '@/lib/prisma'
import { sendBotMessage } from '@/utils/sendBotMessage'
import { Activity, GuildMember, Presence } from 'discord.js'
import { response } from 'osu-api-extended/dist/types/v2_user_details'

const OSU_APP_ID = '367827983903490050'

export const linkAccounts = async (presence: Presence): Promise<void> => {
    if (!presence.member || !presence.activities) return

    for (const activity of presence.activities) {
        if (activity.applicationId === OSU_APP_ID) {
            // console.log('osu! activity detected')
            try {
                await handleOsuActivity(activity, presence.member)
            } catch (error) {
                console.error('Error processing osu! activity:', error)
                await sendBotMessage('Error in linkAccounts')
            }
        }
    }
}

async function handleOsuActivity(
    activity: Activity,
    member: GuildMember
): Promise<void> {
    const username = extractUsernameFromActivity(activity)
    // console.log('Username:', username)
    if (!username) return

    const osuUser = await osuApi.user.details(username, 'osu')
    if (!osuUser) {
        // console.log('No osu! user found for username:', username)
        return
    }
    // console.log('Updating user in database')
    await updateOsuUserInDatabase(osuUser, member)
}

function extractUsernameFromActivity(activity: Activity): string | null {
    const largeText = activity.assets?.largeText
    // console.log('Large text:', largeText)
    if (!largeText) return null

    const username = largeText.split('(', 1)[0].trim()
    return largeText
    // return username === largeText ? null : username;
}

async function updateOsuUserInDatabase(
    osuUser: response,
    member: GuildMember
): Promise<void> {
    const isFromLatvia = osuUser.country.code === 'LV'
    console.log('Updating user in database')
    await prisma.osuUser.upsert({
        where: { id: osuUser.id.toString() },
        update: { enabled: isFromLatvia },
        create: {
            id: osuUser.id.toString(),
            username: osuUser.username,
            pp_score: osuUser.statistics.pp,
            enabled: isFromLatvia,
        },
    })
    console.log('Updating user stats in database')
    await updateOsuStats(osuUser)

    await prisma.user.upsert({
        where: { discord_user_id: member.id.toString() },
        update: { osu_user_id: osuUser.id.toString() },
        create: {
            discord_user_id: member.id.toString(),
            osu_user_id: osuUser.id.toString(),
        },
    })

    console.log(`Account linked for user: ${member.id}`)
}

async function updateOsuStats(osuUser: response): Promise<void> {
    const stats = extractStats(osuUser)
    console.log(stats)
    for (const stat of stats) {
        if (stat.value === null || isNaN(stat.value)) continue
        await prisma.osuStats.upsert({
            where: {
                user_id_stat_name: {
                    user_id: osuUser.id.toString(),
                    stat_name: stat.name,
                },
            },
            update: { stat_value: stat.value, last_updated: new Date() },
            create: {
                user_id: osuUser.id.toString(),
                stat_name: stat.name,
                stat_value: stat.value,
                last_updated: new Date(),
            },
        })
    }
}

function extractStats(
    osuUser: response
): Array<{ name: string; value: number | null }> {
    const statistics = [
        {
            name: 'pp_score',
            value:
                osuUser.statistics.pp !== undefined
                    ? parseFloat(osuUser.statistics.pp)
                    : null,
        },
        {
            name: 'accuracy',
            value:
                osuUser.statistics.hit_accuracy !== undefined
                    ? parseFloat(osuUser.statistics.hit_accuracy)
                    : null,
        },
        {
            name: 'play_count',
            value:
                osuUser.statistics.play_count !== undefined
                    ? parseFloat(osuUser.statistics.play_count)
                    : null,
        },
        {
            name: 'total_score',
            value:
                osuUser.statistics.total_score !== undefined
                    ? parseFloat(osuUser.statistics.total_score)
                    : null,
        },
        {
            name: 'ranked_score',
            value:
                osuUser.statistics.ranked_score !== undefined
                    ? parseFloat(osuUser.statistics.ranked_score)
                    : null,
        },
        {
            name: 'level',
            value:
                osuUser.statistics.level &&
                osuUser.statistics.level.current !== undefined
                    ? parseFloat(osuUser.statistics.level.current)
                    : null,
        },
        {
            name: 'global_rank',
            value:
                osuUser.statistics.global_rank !== undefined
                    ? parseFloat(osuUser.statistics.global_rank)
                    : null,
        },
        {
            name: 'country_rank',
            value:
                osuUser.statistics.country_rank !== undefined
                    ? parseFloat(osuUser.statistics.country_rank)
                    : null,
        },
        {
            name: 'highest_rank',
            value:
                osuUser.rank_highest && osuUser.rank_highest.rank !== undefined
                    ? parseFloat(osuUser.rank_highest.rank)
                    : null,
        },
    ]
    return statistics
}

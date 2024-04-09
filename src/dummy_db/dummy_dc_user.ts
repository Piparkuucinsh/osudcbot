import { prisma } from '@/lib/prisma'
import { v2, auth } from 'osu-api-extended'
import 'dotenv/config'
import { response } from 'osu-api-extended/dist/types/v2_user_details'


function extractStats(
    osuUser: response
): Array<{ name: string; value: number | null }> {
    const statistics = [
        {
            name: 'pp_score',
            value:
                osuUser.statistics.pp !== undefined
                    ? osuUser.statistics.pp
                    : null,
        },
        {
            name: 'accuracy',
            value:
                osuUser.statistics.hit_accuracy !== undefined
                    ? osuUser.statistics.hit_accuracy
                    : null,
        },
        {
            name: 'play_count',
            value:
                osuUser.statistics.play_count !== undefined
                    ? osuUser.statistics.play_count
                    : null,
        },
        {
            name: 'total_score',
            value:
                osuUser.statistics.total_score !== undefined
                    ? osuUser.statistics.total_score
                    : null,
        },
        {
            name: 'ranked_score',
            value:
                osuUser.statistics.ranked_score !== undefined
                    ? osuUser.statistics.ranked_score
                    : null,
        },
        {
            name: 'level',
            value:
                osuUser.statistics.level &&
                    osuUser.statistics.level.current !== undefined
                    ? osuUser.statistics.level.current
                    : null,
        },
        {
            name: 'global_rank',
            value:
                osuUser.statistics.global_rank !== undefined
                    ? osuUser.statistics.global_rank
                    : null,
        },
        {
            name: 'country_rank',
            value:
                osuUser.statistics.country_rank !== undefined
                    ? osuUser.statistics.country_rank
                    : null,
        },
        {
            name: 'highest_rank',
            value:
                osuUser.rank_highest && osuUser.rank_highest.rank !== undefined
                    ? osuUser.rank_highest.rank
                    : null,
        },
    ]
    return statistics
}

// const usernames = ["mrekk", "rayuii", "ciru", "tomasz chic", "Milkteaism", "Accolibed", "lifeline", "WindowLife", "aimbotcone", "maliszewski"];
const usernames = ['Piparkuucinsh']
for (const username of usernames) {
    try {
        (async () => {
            const client_id: string = process.env.OSU_CLIENT_ID!
            const secret_key: string = process.env.OSU_CLIENT_SECRET!

            await auth.login(Number(client_id), secret_key, ['public'])
            const osuUser = await v2.user.details(username, 'osu')
            await prisma.osuUser.create({
                data: {
                    id: osuUser.id.toString(), // osu! user ID
                    username: username, // Discord tag includes the username and discriminator
                    registration_date: new Date(osuUser.join_date), // When they joined the server
                    last_activity_date: new Date(), // Set to current date-time for now
                    pp_score: osuUser.statistics.pp, // Performance points
                    enabled: true, // Assuming the user is not deleted when they're being added
                },
            })
            const discord_user = await prisma.discordUser.create({
                data: {
                    // id must be random
                    id: BigInt(
                        Math.floor(Math.random() * 1000000000000)
                    ).toString(),
                    username: username, // Discord tag includes the username and discriminator
                    registration_date: new Date(), // When they joined the server
                    last_activity_date: new Date(), // Set to current date-time for now
                    deleted: false, // Assuming the user is not deleted when they're being added
                },
            })
            await prisma.user.create({
                data: {
                    discord_user_id: discord_user.id,
                    osu_user_id: osuUser.id.toString(),
                },
            })
            const stats_extracted = extractStats(osuUser)
            for (const stat of stats_extracted) {
                if (stat.value === null) continue
                await prisma.osuStats.upsert({
                    where: {
                        user_id_stat_name: {
                            user_id: osuUser.id.toString(),
                            stat_name: stat.name,
                        },
                    },
                    update: {
                        stat_value: stat.value,
                        last_updated: new Date(),
                    },
                    create: {
                        user_id: osuUser.id.toString(),
                        stat_name: stat.name,
                        stat_value: stat.value,
                        last_updated: new Date(),
                    },
                })
            }
        })()
        console.log(`User ${username} added to the database`)
    } catch (error) {
        console.error(`Could not add user ${username}: ${error}`)
    }
}

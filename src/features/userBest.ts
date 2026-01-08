import { listLinkedPlayers, setLastChecked } from '@/lib/db'
import { warn } from '@/lib/log'
import { getGuildMember } from '@/services/discord'
import { config } from '@/init/config'
import { getRankRoleKeyForMember } from '@/lib/roles'
import { getOsuUserById, getUserBestScores } from '@/services/osu'
import { Beatmap, BeatmapAttributesBuilder, Performance } from 'rosu-pp-js'
import { EmbedBuilder } from 'discord.js'
import { sendBotSpam } from '@/services/discord'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const LOOP_INTERVAL_MS = 60 * 60 * 1000

let loopTimer: NodeJS.Timeout | null = null

export const startUserBestLoop = (): void => {
    if (loopTimer) return
    loopTimer = setInterval(() => {
        void runUserBestLoop()
    }, LOOP_INTERVAL_MS)
}

export const stopUserBestLoop = (): void => {
    if (loopTimer) {
        clearInterval(loopTimer)
        loopTimer = null
    }
}

export const runUserBestLoop = async (): Promise<void> => {
    try {
        const linkedPlayers = await listLinkedPlayers()
        for (const player of linkedPlayers) {
            await processPlayer(
                player.discord_id,
                player.osu_id,
                player.last_checked
            )
        }
    } catch (error) {
        warn(`error in user_best loop: ${String(error)}`)
    }
}

const processPlayer = async (
    discordId: string,
    osuId: number,
    lastCheckedRaw: string | null
): Promise<void> => {
    const member = await getGuildMember(discordId)
    if (!member) return

    const rankRoleKey = getRankRoleKeyForMember(
        member.roles.cache.map((r) => r.id)
    )
    if (!rankRoleKey) return

    const limit = config.rankRoles[rankRoleKey].userNewBestLimit
    if (limit <= 0) return

    const lastChecked = parseLastChecked(lastCheckedRaw)
    const scores = await getUserBestScores(osuId, limit)
    if (!scores) return

    for (let i = 0; i < scores.length; i += 1) {
        const score = scores[i]
        if (score.ruleset_id !== 0) continue

        const scoreTime = new Date(score.ended_at)
        if (Number.isNaN(scoreTime.getTime())) continue
        if (scoreTime <= lastChecked) continue

        const scoreRank = i + 1
        await postUserBest(score, limit, scoreRank)
    }

    await setLastChecked(discordId, new Date().toISOString())
}

const parseLastChecked = (value: string | null): Date => {
    if (!value) {
        return new Date(Date.now() - LOOP_INTERVAL_MS)
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return new Date(Date.now() - LOOP_INTERVAL_MS)
    }
    return parsed
}

type UserBestScore = NonNullable<
    Awaited<ReturnType<typeof getUserBestScores>>
>[number]

const postUserBest = async (
    score: UserBestScore,
    limit: number,
    scoreRank: number
): Promise<void> => {
    const osuUser = await getOsuUserById(score.user_id)
    if (!osuUser) return

    const beatmap = await getBeatmap(score.beatmap_id)
    if (!beatmap) return
    if (beatmap.isSuspicious()) {
        warn(`beatmap ${score.beatmap_id} flagged as suspicious`)
        beatmap.free()
        return
    }

    const mods = score.mods.map((m) => m.acronym).join('')
    const perfMax = new Performance({ mods }).calculate(beatmap)

    const stats = score.statistics
    const n300 = stats.great ?? 0
    const n100 = stats.ok ?? 0
    const n50 = stats.meh ?? 0
    const misses = stats.miss ?? 0

    // const perf = new Performance({
    //     mods,
    //     n300,
    //     n100,
    //     n50,
    //     misses,
    //     combo: score.max_combo,
    // }).calculate(beatmap)

    const attrsBuilder = new BeatmapAttributesBuilder()
    attrsBuilder.mods = mods
    attrsBuilder.map = beatmap
    const mapAttrs = attrsBuilder.build()

    const timeText = formatTime(score.beatmap.total_length, mapAttrs.clockRate)
    const bpmText = formatBpm(score.beatmap.bpm, mapAttrs.clockRate)

    const rankEmoji = config.rankEmojis[score.rank] ?? ''
    const modText = mods ? ` +${mods}` : ''
    const totalScore =
        score.legacy_total_score && score.legacy_total_score !== 0
            ? score.legacy_total_score
            : score.total_score

    const embed = new EmbedBuilder()
        .setColor(0x0084ff)
        .setDescription(`**__Personal Best #${scoreRank}__**`)
        .setAuthor({
            name: `${osuUser.username}: ${(osuUser.statistics.pp ?? 0).toFixed(
                2
            )}pp (#${osuUser.statistics.global_rank ?? '??'} ${
                osuUser.country_code
            }${osuUser.statistics.country_rank ?? '??'})`,
            url: `https://osu.ppy.sh/users/${osuUser.id}`,
            iconURL: osuUser.avatar_url,
        })
        .setThumbnail(score.beatmapset.covers.list)
        .setURL(`https://osu.ppy.sh/b/${score.beatmap_id}`)
        .setTitle(
            `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}] [${perfMax.difficulty.stars.toFixed(
                2
            )}★]`
        )
        .addFields({
            name: `** ${rankEmoji}${modText}\t${totalScore.toLocaleString()}\t(${(
                score.accuracy * 100
            ).toFixed(2)}%) **`,
            value: `**${(score.pp ?? 0).toFixed(2)}**/${perfMax.pp.toFixed(
                2
            )}pp [ **${score.max_combo}x**/${perfMax.difficulty.maxCombo}x ] {${n300}/${n100}/${n50}/${misses}}
${timeText} | ${bpmText}
<t:${Math.floor(score.ended_at.getTime() / 1000)}:R> | Limit: ${limit}`,
        })

    await sendBotSpam({ embeds: [embed] })
    beatmap.free()
}

const getBeatmap = async (beatmapId: number): Promise<Beatmap | null> => {
    const dir = join(process.cwd(), 'beatmaps')
    const path = join(dir, `${beatmapId}.osu`)

    if (!existsSync(path)) {
        const resp = await fetch(`https://osu.ppy.sh/osu/${beatmapId}`)
        if (!resp.ok) {
            warn(`failed to download beatmap ${beatmapId}: ${resp.status}`)
            return null
        }
        mkdirSync(dir, { recursive: true })
        const data = new Uint8Array(await resp.arrayBuffer())
        writeFileSync(path, data)
    }

    const bytes = readFileSync(path)
    return new Beatmap(bytes)
}

const formatTime = (seconds: number, clockRate: number): string => {
    const base = formatDuration(seconds)
    if (clockRate === 1) return base
    const adjusted = formatDuration(Math.round(seconds / clockRate))
    return `${base} (${adjusted})`
}

const formatBpm = (bpm: number, clockRate: number): string => {
    if (clockRate === 1) return `${bpm} BPM`
    return `${bpm} -> **${Math.round(bpm * clockRate)} BPM**`
}

const formatDuration = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

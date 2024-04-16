import { vi, describe, it, expect } from 'vitest'
import { linkAccounts } from '@/utils/linkAccount'
import { Presence, Activity, GuildMember } from 'discord.js'
import { v2 as osuApi } from 'osu-api-extended'
import prisma from '@/lib/__mocks__/prisma'
import { sendBotMessage } from '@/utils/sendBotMessage'
import { mockDeep } from 'vitest-mock-extended'
import { response } from 'osu-api-extended/dist/types/v2_user_details'
import { beforeEach } from 'node:test'

// Mock the necessary dependencies
beforeEach(() => {
    vi.resetAllMocks()
})

vi.mock('osu-api-extended')
vi.mock('@/lib/prisma')
vi.mock('@/utils/sendBotMessage')

describe('linkAccounts', () => {
    it('should handle osu! activity and update user in database', async () => {
        const presence = {
            member: {} as GuildMember,
            activities: [
                {
                    applicationId: '367827983903490050',
                    assets: {
                        largeText: 'osu!username',
                    },
                } as Activity,
            ],
        } as Presence

        const osuUser = {
            id: '123',
            username: 'osu!username',
            country: {
                code: 'LV',
            },
            statistics: {
                pp: 1000,
                hit_accuracy: 95,
                play_count: 100,
                total_score: 50000,
                ranked_score: 25000,
                level: {
                    current: 50,
                },
                global_rank: 1000,
                country_rank: 50,
            },
            rank_highest: {
                rank: 10,
            },
        } as unknown as response

        vi.mocked(osuApi, true).user.details.mockResolvedValue(osuUser)

        await linkAccounts(presence)

        expect(osuApi.user.details).toHaveBeenCalledWith('osu!username', 'osu')
        expect(prisma.osuUser.upsert).toHaveBeenCalledWith({
            where: { id: '123' },
            update: { enabled: true },
            create: {
                id: '123',
                username: 'osu!username',
                pp_score: 1000,
                enabled: true,
            },
        })
        expect(prisma.user.upsert).toHaveBeenCalledWith({
            where: { discord_user_id: expect.any(String) },
            update: { osu_user_id: '123' },
            create: {
                discord_user_id: expect.any(String),
                osu_user_id: '123',
            },
        })
        expect(prisma.osuStats.upsert).toHaveBeenCalledTimes(9)
        expect(sendBotMessage).not.toHaveBeenCalled()
    })

    it('should not handle osu! activity if no member or activities', async () => {
        const presence: Presence = {
            member: null,
            activities: null,
        } as unknown as Presence

        await linkAccounts(presence)

        expect(osuApi.user.details).not.toHaveBeenCalled()
        expect(prisma.osuUser.upsert).not.toHaveBeenCalled()
        expect(prisma.user.upsert).not.toHaveBeenCalled()
        expect(prisma.osuStats.upsert).not.toHaveBeenCalled()
        expect(sendBotMessage).not.toHaveBeenCalled()
    })

    it('should handle osu! activity and handle error', async () => {
        const presence = {
            member: {} as GuildMember,
            activities: [
                {
                    applicationId: '367827983903490050',
                    assets: {
                        largeText: 'osu!username',
                    },
                } as Activity,
            ],
        } as Presence

        const error = new Error('Test error')
        vi.mocked(osuApi, true).user.details.mockRejectedValue(error)

        await linkAccounts(presence)

        expect(osuApi.user.details).toHaveBeenCalledWith('osu!username', 'osu')
        expect(prisma.osuUser.upsert).not.toHaveBeenCalled()
        expect(prisma.user.upsert).not.toHaveBeenCalled()
        expect(prisma.osuStats.upsert).not.toHaveBeenCalled()
        expect(sendBotMessage).toHaveBeenCalledWith('Error in linkAccounts')
    })
})

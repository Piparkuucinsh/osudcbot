import { config } from '@/config'
import { getRoleIdWithRank } from '@/utils/roles'
// import prisma from "@/lib/__mocks__/prisma";
// import { config } from "@/config";
import { vi, describe, it, expect } from 'vitest'

vi.mock('@/lib/prisma')
vi.mock('@/config', () => {
    return {
        config: {
            bot_guild_id: '1194228698430320690',
            bot_channel_id: '1223972712716701706',
            desa: '<:madars:897728842574233671>',
            roles: {
                outside_range: {
                    id: '',
                    name: 'Madar',
                },
                restricted: {
                    id: '',
                    name: 'pacans',
                },
                outside_country: {
                    id: '',
                    name: 'goonpacanchik',
                },
                rank_roles: [
                    {
                        threshold: 100,
                        id: '1221950853913772082',
                        name: 'top100',
                    },
                    {
                        threshold: 500,
                        id: '1221950856476491917',
                        name: 'top500',
                    },
                    {
                        threshold: 1000,
                        id: '1221950842081509467',
                        name: 'top1000',
                    },
                ],
            },
        },
    }
})

describe('getRoleIdWithRank', () => {
    it('should return the correct role ID based on rank', () => {
        const rank = 1
        const roleId = getRoleIdWithRank(rank)
        expect(roleId).toBe(config.roles.rank_roles[0].id)
    })
    it('should return outside_range role ID if rank is greater than the highest threshold', () => {
        const rank = 2000
        const roleId = getRoleIdWithRank(rank)
        expect(roleId).toBe(config.roles.outside_range.id)
    })
    it('should return correct role on treshold', () => {
        const rank = 100
        const roleId = getRoleIdWithRank(rank)
        expect(roleId).toBe(config.roles.rank_roles[0].id)
    })
    it('should return null on invalid rank', () => {
        const rank = -1
        const roleId = getRoleIdWithRank(rank)
        expect(roleId).toBe(null)
    })
})

import { prisma } from '@/lib/prisma'
import { getCurrentRoleIds, getRoleIdWithRank } from '@/utils/roles'
import { v2 } from 'osu-api-extended'

export const refreshRoles = async () => {
    const combinedList = []
    for (let i = 0; i < 20; i++) {
        const page = await v2.site.ranking.details('osu', 'performance', {
            country: 'LV',
            'cursor[page]': i,
        })
        combinedList.push(...page.ranking)
    }

    const id_list = combinedList.map((x) => x.user.id)
    const users = await prisma.user.findMany({
        where: {
            in_server: true,
            osu_user: {
                enabled: true,
            },
            osu_user_id: { not: null },
        },
    })

    for (const user of users) {
        if (user.osu_user_id) {
            let position = id_list.indexOf(user.osu_user_id)

            const currentRoleId = await getCurrentRoleIds(
                String(user.discord_user_id)
            )

            if (position === -1) {
                try {
                    const osuUserFromApi = await v2.user.details(
                        user.osu_user_id,
                        'osu'
                    )

                    if (
                        osuUserFromApi &&
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (osuUserFromApi as any).error == null
                    ) {
                        const peppy = await v2.user.details(2, 'osu')
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if ((peppy as any).error == null) {
                            continue
                        }

                        //set restricted role
                        continue
                    }

                    if (osuUserFromApi.statistics.is_ranked === false) {
                        //set inactive role
                        continue
                    }

                    position = osuUserFromApi.statistics.country_rank
                } catch {
                    console.error(
                        `Error fetching user ${user.osu_user_id} from osu api`
                    )
                }
            }

            const newRoleId = getRoleIdWithRank(position)

            //set new role
        }
    }
    console.log(combinedList.length)
}

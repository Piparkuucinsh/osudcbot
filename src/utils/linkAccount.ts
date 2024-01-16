import { v2 } from '../../node_modules/osu-api-extended/dist/index';
import { prisma } from '../lib/prisma'
import { client } from 'index';
import { sendBotMessage } from './sendBotMessage';

const OSU_APP_ID = "367827983903490050";

const linkAccounts = async () => {
    try {
        for (const guild of client.guilds.cache.values()) {
            for (const member of guild.members.cache.values()) {
                for (const activity of member.presence?.activities || []) {
                    if (activity.applicationId !== OSU_APP_ID) continue;

                    const username = activity.state?.split('(', 1)[0].trim();
                    if (!username || username === activity.state) continue;

                    const osuUser = await v2.user.details(username, 'osu')

                    if (!osuUser) continue;

                    const player = await prisma.osuUser.findUnique({
                        where: {
                            id: Number(member.id),
                        }, include: {
                            User: true
                        }
                    });


                    // check for multiacc
                    if (player && player.User && Number(player.User.discord_user_id) !== Number(member.id)) {
                        //unlink osuser from user and link to correct user
                        console.log("MULTIACCOUNT!!");
                        continue;
                    }

                    if (osuUser.country.code === 'LV') {
                        // link osuuser to user (create osuuser if doesnt exist)
                    } else {
                        // link osuuser to account but disable roles

                    }
                }
            }
        }
    } catch (error) {
        console.error(error);
        sendBotMessage("error in link_acc");
    }
}

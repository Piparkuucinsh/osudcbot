// import { prisma } from "lib/prisma";

// const newbestloop = async () => {
//     const users = await prisma.user.findMany({where: {
//         osu_user_id: {not: null},
//     }});

//     for (const user of users) {

//         const current_role = rev_roles[member.roles.find(role => roles[role.id])];

//         if (rolesvalue[current_role] > 9) {
//             continue;
//         }

//         const last_checked = row.last_checked ? new Date(row.last_checked) : new Date(Date.now() - 60 * 60 * 1000);
//         const limit = user_newbest_limit[current_role];

//         await get_user_newbest(row.osu_id, limit, last_checked);

//         await prisma.players.update({
//             where: {
//                 discord_id: row.id
//             },
//             data: {
//                 last_checked: new Date().toISOString().slice(0, 19).replace('T', ' ')
//             }
//         });

//         await new Promise(resolve => setTimeout(resolve, 100));
//     }
// }
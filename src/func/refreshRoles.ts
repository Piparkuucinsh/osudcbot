import { prisma } from "@/lib/prisma";
import { v2 } from "osu-api-extended";

export const refreshRoles = async () => {
  const combinedList = [];
  for (let i = 0; i < 20; i++) {
    const page = await v2.site.ranking.details("osu", "performance", {
      country: "LV",
      "cursor[page]": i,
    });
    combinedList.push(...page.ranking);
  }

  const id_list = combinedList.map((x) => x.user.id);
  const users = await prisma.user.findMany({where: {
    in_server: true,
    osu_user: {
      enabled: true
    },
    osu_user_id: {not: null}
  }})

  for (const user of users) {
    if (user.osu_user_id) {
      
    }
  }

  // const positions = users.map(user => id_list.indexOf(user.osu_user_id)




  console.log(combinedList.length);
};

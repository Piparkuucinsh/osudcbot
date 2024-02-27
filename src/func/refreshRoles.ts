import { v2 } from "osu-api-extended";

export const refreshRoles = async () => {
  const page = await v2.site.ranking.details("osu", "performance", {
    country: "LV",
    "cursor[page]": 0,
  });
  console.log(page);
};
import { config } from "../config";
// Function to get the corresponding role ID based on rank.
function getRoleWithRank(rank: number): string {
  if (rank > 1000) return "LVinf";

  const role = config.roles.find(({ threshold }) => rank >= threshold);
  return role ? role.roleId : "";
}

export default getRoleWithRank;

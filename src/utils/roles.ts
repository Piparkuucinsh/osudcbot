import { guild } from "..";
import { config } from "../config";

// Function to get the corresponding role ID based on rank.
export const getRoleWithRank = (rank: number): string => {
  if (rank > config.roles[0].threshold) return "LVinf";

  const role = config.roles.find(({ threshold }) => rank >= threshold);
  return role ? role.roleId : "";
};

export const getCurrentRoleId = async (discordUserId: string): Promise<string | null> => {
  try {
      const member = await guild.members.fetch(discordUserId);
      const roles = member.roles.cache.map(role => role.id);

      const matchingRole = roles.find(roleId => config.roles.some(role => role.roleId === roleId));

      return matchingRole || null; 

  } catch (error) {
      console.error('Error fetching member or roles:', error);
      return null;
  }
};
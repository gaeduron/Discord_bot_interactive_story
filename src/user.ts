import { Guild, GuildMember, User } from "discord.js";
// import { Guild, GuildMember, User } from "discord.js";

export const getMemberFromUser = async (user: User, guild: Guild | null): Promise<GuildMember | null> => {
  if (guild) {
    return await guild.members.fetch(user);
  }
  return null;
}

export const getMemberRoles = (member: GuildMember | null): string[] => {
  if (!member) {
    return []
  }
  const roles = member.roles.cache.map(role => role.name)
  return roles;
}
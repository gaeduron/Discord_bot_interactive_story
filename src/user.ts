import { Guild, GuildMember, User } from "discord.js";
import quests from "./quests/quests.json";
import { Quest } from "./quests/types/quest";

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

export const getMemberCurrentQuest = (member: GuildMember): Quest => {
  const roles = getMemberRoles(member);
  const gameQuests = quests as Quest[];
  const accessibleQuests: Quest[] = [];

  roles.forEach((role) => {
    accessibleQuests.push(gameQuests.find(quest => quest.name === role))
  })

  let mostAdvancedQuest = gameQuests[0];
  accessibleQuests.forEach((quest) => {
    if (quest && gameQuests.findIndex(gameQuest => gameQuest.name === mostAdvancedQuest.name) < gameQuests.findIndex(gameQuest => gameQuest.name === quest.name)) {
      mostAdvancedQuest = quest
    }
  })
  return mostAdvancedQuest;
}
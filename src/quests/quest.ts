import { Guild, GuildMember, User } from "discord.js";
import { Quest } from "./types/quest";

export const startQuest = async (member: GuildMember, quest: Quest): Promise<null> => {
  quest.scenario.every((scenarioMessage) => {
    if (scenarioMessage.expectedResponses != null) {
      member.send(scenarioMessage.messageBoxContent);
      return false;
    }

    member.send(scenarioMessage.messageBoxContent);
    return true;
  })
  return null;
}

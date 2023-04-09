import { GuildMember } from "discord.js";
import { Quest, ScenarioMessage } from "./types/quest";
import { setTimeout as sleep } from 'timers/promises'
import { existsSync } from "fs"; 

const displayScenarioMessage = async (member: GuildMember, scenarioMessage: ScenarioMessage): Promise<null> => {
  const characterImage = `./src/images/${scenarioMessage.character}_${scenarioMessage.characterEmotion || "default" }.png`
  const characterDefaultImage = `./src/images/${scenarioMessage.character}_default.png`
  if (existsSync(characterImage)) {
    await member.send({files: [characterImage]});
    await member.send(scenarioMessage.messageBoxContent);
    await member.send({files: ["./src/images/closing_message_box.png"]});
  } else if (existsSync(characterDefaultImage)) {
    await member.send({files: [characterDefaultImage]});
    await member.send(scenarioMessage.messageBoxContent);
    await member.send({files: ["./src/images/closing_message_box.png"]});
  } else {
    await member.send(`**${scenarioMessage.character}** ${(scenarioMessage.characterEmotion  || "").toLowerCase()}:`);
    await member.send(scenarioMessage.messageBoxContent);
  }

  if (scenarioMessage.imageFile) {
    await member.send({files: [`./src/images/${scenarioMessage.imageFile}`]});
  }
  await sleep((scenarioMessage.messageBoxContent.length / 20) * 1000)
  return null
}

export const startQuest = async (member: GuildMember, quest: Quest): Promise<null> => {
  let currentMessageIndex = 0;
  const responseExpectedMessageIndex = quest.scenario.findIndex(message => message.expectedResponses != null)

  while (currentMessageIndex <= responseExpectedMessageIndex) {
    await displayScenarioMessage(member, quest.scenario[currentMessageIndex])
    currentMessageIndex += 1;
  }
  return null;
}

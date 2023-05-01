import { GuildMember, Message } from "discord.js";
import { Quest, ScenarioMessage, ScenarioSubMessage, MessageHandler } from "./types/quest";
import { setTimeout } from 'timers/promises'
import { existsSync } from "fs"; 

export const getCharacterImagePath = (scenarioMessage: ScenarioMessage|ScenarioSubMessage): string => {
  const imagePath = `${process.cwd()}/src/images/${scenarioMessage.character}_${scenarioMessage.characterEmotion}.png`;
  const defaultImagePath = `${process.cwd()}/src/images/${scenarioMessage.character}_default.png`;
  if (existsSync(imagePath)) {
    return imagePath;
  } else if (existsSync(defaultImagePath)) {
    return defaultImagePath;
  } else {
    return "";
  }
}

export const displayScenarioMessage = async (member: GuildMember, scenarioMessage: ScenarioMessage|ScenarioSubMessage): Promise<null> => {
  const characterImage =  getCharacterImagePath(scenarioMessage);
  if (characterImage != "") {
    await member.send({files: [characterImage]});
    await member.send(scenarioMessage.messageBoxContent);
    await member.send({files: [`${process.cwd()}/src/images/closing_message_box.png`]});
  } else {
    await member.send(`**${scenarioMessage.character}** ${(scenarioMessage.characterEmotion || "").toLowerCase()}:`);
    await member.send(scenarioMessage.messageBoxContent);
  }

  if ("imageFile" in scenarioMessage && scenarioMessage.imageFile) {
    await member.send({files: [`${process.cwd()}/src/images/${scenarioMessage.imageFile}`]});
  }
  if (process.env.NODE_ENV !== 'test') {
    await setTimeout(((scenarioMessage.messageBoxContent.length / 20) * 1000))
  }
  return null
};

export const startQuest = async (member: GuildMember, messages: ScenarioMessage[], messageHandler: MessageHandler): Promise<null> => {
  messages.forEach(async message => {
    await messageHandler(member, message)
  });
  return null
}

export const questStartMessages = (quest: Quest): ScenarioMessage[] => {
  let currentMessageIndex = 0;
  let responseExpectedMessageIndex = quest.scenario.findIndex(message => message.expectedResponses != null)
  if (responseExpectedMessageIndex === -1) {
    responseExpectedMessageIndex = quest.scenario.length - 1;
  }
  const messagesToSend: ScenarioMessage[] = []

  while (currentMessageIndex <= responseExpectedMessageIndex) {
    messagesToSend.push(quest.scenario[currentMessageIndex]);
    currentMessageIndex += 1;
  }
  return messagesToSend;
}

export const messageIsCorrect = (currentScenarioMessage: ScenarioMessage , message: Message): Boolean => {
  let isCorrect = false;
  currentScenarioMessage.expectedResponses.forEach((expectedResponse) => {
    if (message.content.toLowerCase().includes(expectedResponse.toLowerCase())) {
      isCorrect = true;
    }
  })
  return isCorrect
}

export const sendWrongResponseMessage = async (member: GuildMember, currentScenarioMessage: ScenarioMessage, random_num: number, messageHandler: MessageHandler): Promise<string> => {
  if (random_num > 0.8) {
    await messageHandler(member, currentScenarioMessage.hintResponse);
    return "hint"
  } else {
    await messageHandler(member, currentScenarioMessage.errorResponse);
    return "error"
  }
}

export const displayQuestLastMessages = async (member: GuildMember, memberCurrentQuest: Quest, messageHandler: MessageHandler): Promise<null> => {
  let currentMessageIndex = memberCurrentQuest.scenario.findIndex(message => message.expectedResponses != null) + 1;
  while (currentMessageIndex < memberCurrentQuest.scenario.length) {
    await messageHandler(member, memberCurrentQuest.scenario[currentMessageIndex]);
    currentMessageIndex += 1;
  }
  return null
}

export const addQuestCompletedRole = async (member: GuildMember, memberCurrentQuest: Quest, allQuests: Quest[]): Promise<Quest|string> => {
  const nextQuest: Quest | undefined = allQuests[allQuests.findIndex(quest => quest.name == memberCurrentQuest.name) + 1];
  if (typeof nextQuest === 'undefined') {
    return "No next quest"
  }
  let guildRole = member.guild.roles.cache.find(role => role.name == nextQuest.name)
  if (!guildRole) {
    await member.guild.roles.create({
      name: nextQuest.name,
    })
    guildRole = member.guild.roles.cache.find(role => role.name == nextQuest.name)
  }

  await member.roles.add(guildRole);
  return nextQuest
}

export const finishQuest = async (member: GuildMember, memberCurrentQuest: Quest, allQuests: Quest[], timeoutDuration = 3000): Promise<Quest|string> => {
  await displayQuestLastMessages(member, memberCurrentQuest, displayScenarioMessage)
  const nextQuest = await addQuestCompletedRole(member, memberCurrentQuest, allQuests)
  if (typeof nextQuest !== 'string') {
    await setTimeout(timeoutDuration);
    await startQuest(member,questStartMessages(nextQuest), displayScenarioMessage);
  } else {
    await displayScenarioMessage(member, {
        messageBoxContent: "Vous avez fini toutes les enquêtes disponible.",
        character: "System",
        characterEmotion: null,
        expectedResponses: null
    })
  }
  return nextQuest
}
import { Guild, GuildMember, Message } from "discord.js";
import { Quest, ScenarioMessage, ScenarioSubMessage } from "./types/quest";
import quests from "./quests.json";
import { setTimeout as sleep } from 'timers/promises'
import { existsSync } from "fs"; 
import { getMemberCurrentQuest, getMemberFromUser } from "../user";

export const getCharacterImagePath = (scenarioMessage: ScenarioMessage|ScenarioSubMessage): string => {
  const imagePath =  `src/images/${scenarioMessage.character}_${scenarioMessage.characterEmotion}.png`;
  const defaultImagePath =  `src/images/${scenarioMessage.character}_default.png`;
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
    await member.send({files: ["src/images/closing_message_box.png"]});
  } else {
    await member.send(`**${scenarioMessage.character}** ${(scenarioMessage.characterEmotion || "").toLowerCase()}:`);
    await member.send(scenarioMessage.messageBoxContent);
  }

  if ("imageFile" in scenarioMessage && scenarioMessage.imageFile) {
    await member.send({files: [`src/images/${scenarioMessage.imageFile}`]});
  }
  await sleep((scenarioMessage.messageBoxContent.length / 20) * 1000)
  return null
};

export const startQuest = async (
  member: GuildMember,
  messages: ScenarioMessage[],
  messageHandler: (member: GuildMember, scenarioMessage: ScenarioMessage | ScenarioSubMessage) => Promise<null>
  ): Promise<null> => {
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


/// NEW CODE


export const messageIsCorrect = (currentScenarioMessage: ScenarioMessage , message: Message): Boolean => {
  let isCorrect = false;
  currentScenarioMessage.expectedResponses.forEach((expectedResponse) => {
    if (message.content.toLowerCase().includes(expectedResponse.toLowerCase())) {
      isCorrect = true;
    }
  })
  return isCorrect
}

export const sendWrongResponseMessage = async (member, currentScenarioMessage, random_num, messageHandler): Promise<string> => {
  if (random_num > 0.8) {
    await messageHandler(member, currentScenarioMessage.hintResponse);
    return "hint"
  } else {
    await messageHandler(member, currentScenarioMessage.errorResponse);
    return "error"
  }
}

export const displayQuestLastMessages = async (member: GuildMember, memberCurrentQuest: Quest): Promise<null> => {
  let currentMessageIndex = memberCurrentQuest.scenario.findIndex(message => message.expectedResponses != null) + 1;
  while (currentMessageIndex < memberCurrentQuest.scenario.length) {
    await displayScenarioMessage(member, memberCurrentQuest.scenario[currentMessageIndex]);
    currentMessageIndex += 1;
  }
  return null
}

export const addQuestCompletedRole = async (member: GuildMember, memberCurrentQuest: Quest): Promise<Quest|undefined> => {
  const nextQuest: Quest | undefined = quests[quests.findIndex(quest => quest.name == memberCurrentQuest.name) + 1];
  let guildRole = member.guild.roles.cache.find(role => role.name == nextQuest.name)
  if (!guildRole) {
    await member.guild.roles.create({
      name: nextQuest.name,
    })
    guildRole = member.guild.roles.cache.find(role => role.name == nextQuest.name)
  }

  member.roles.add(guildRole);
  return nextQuest
}

export const finishQuest = async (member: GuildMember, memberCurrentQuest: Quest): Promise<Quest|undefined> => {
  await displayQuestLastMessages(member, memberCurrentQuest)
  const nextQuest = await addQuestCompletedRole(member, memberCurrentQuest)
  await sleep(3 * 1000);
  startQuest(member,questStartMessages(nextQuest), displayScenarioMessage);

  return nextQuest
}

export const questResponse = async (message: Message, guild: Guild): Promise<null> => {
	const member = await getMemberFromUser(message.author, guild);
	const memberCurrentQuest = await getMemberCurrentQuest(member);
  const currentScenarioMessage: ScenarioMessage|undefined = memberCurrentQuest.scenario.find(message => message.expectedResponses);
  if (currentScenarioMessage === undefined) {
    throw "Scenario error: Missing a message with expectecedResponces"
  }
  const isCorrect = messageIsCorrect(currentScenarioMessage, message)
  
  if (isCorrect) {
    await finishQuest(member, memberCurrentQuest)
  } else {
    await sendWrongResponseMessage(member, currentScenarioMessage, Math.random(), displayScenarioMessage)
  }
  return null;
}
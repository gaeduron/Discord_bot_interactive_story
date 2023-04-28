import { Guild, GuildMember, Message } from "discord.js";
import { Quest, ScenarioMessage, ScenarioSubMessage } from "./types/quest";
import quests from "./quests.json";
import { setTimeout as sleep } from 'timers/promises'
import { existsSync } from "fs"; 
import { getMemberCurrentQuest, getMemberFromUser } from "../user";

const displayScenarioMessage = async (member: GuildMember, scenarioMessage: ScenarioMessage|ScenarioSubMessage): Promise<null> => {
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

  if ("imageFile" in scenarioMessage && scenarioMessage.imageFile) {
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

export const questResponse = async (message: Message, guild: Guild): Promise<null> => {
  const expectedResponses: string[] = []

  // get user quest
	const member = await getMemberFromUser(message.author, guild);
	const memberCurrentQuest = await getMemberCurrentQuest(member);
  const currentScenarioMessage = memberCurrentQuest.scenario.find(message => message.expectedResponses);

  // verify if response match
  let messageIsCorrect = false;
  currentScenarioMessage.expectedResponses.forEach((expectedResponse) => {
    if (message.content.toLowerCase().includes(expectedResponse.toLowerCase())) {
      messageIsCorrect = true;
    }
  })
  
  if (messageIsCorrect) {
    let currentMessageIndex = memberCurrentQuest.scenario.findIndex(message => message.expectedResponses != null) + 1;
    while (currentMessageIndex < memberCurrentQuest.scenario.length) {
      await displayScenarioMessage(member, memberCurrentQuest.scenario[currentMessageIndex]);
      currentMessageIndex += 1;
    }
    // setup next quest
    const nextQuest: Quest | undefined = quests[quests.findIndex(quest => quest.name == memberCurrentQuest.name) + 1];
    let guildRole = member.guild.roles.cache.find(role => role.name == nextQuest.name)
    if (!guildRole) {
      await member.guild.roles.create({
        name: nextQuest.name,
      })
      guildRole = member.guild.roles.cache.find(role => role.name == nextQuest.name)
    }

    member.roles.add(guildRole);

    await sleep(3 * 1000);

    startQuest(member,nextQuest);
  } else {
    if (Math.random() > 0.8) {
      await displayScenarioMessage(member, currentScenarioMessage.hintResponse);
    } else {
      await displayScenarioMessage(member, currentScenarioMessage.errorResponse);
    }
  }
  return null;
}
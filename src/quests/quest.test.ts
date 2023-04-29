import {describe, expect, test, it} from '@jest/globals';
import { GuildMember, Message } from 'discord.js';
import {
  questStartMessages,
  startQuest,
  getCharacterImagePath,
  displayScenarioMessage,
  messageIsCorrect,
  sendWrongResponseMessage
  } from './quest';
import quests from "./quests_test.json";
import { Quest, ScenarioMessage } from './types/quest';

const gameQuests = quests;

describe("Quest module", () => {
  
  describe("Quest start messages", () => {
      test('read up to message with expected response', () => {
      expect(questStartMessages(gameQuests[0]).length).toBe(2);
    });
    
    test('read all message if no expected response', () => {
      expect(questStartMessages(gameQuests[2]).length).toBe(3);
    });
    
    test('if no message return empty list', () => {
      expect(questStartMessages(gameQuests[3]).length).toBe(0);
    });
  });

  describe("Start Quest", () => {
    it("Should send all messages", () => {
      const messageHandler = jest.fn();
      const member = {} as GuildMember;
      startQuest(member, questStartMessages(gameQuests[2]), messageHandler)
      expect(messageHandler).toBeCalledTimes(3)
    })

    it("Should send no message if no message given", () => {
      const messageHandler = jest.fn();
      const member = {} as GuildMember;
      startQuest(member, [], messageHandler)
      expect(messageHandler).toBeCalledTimes(0)
    })
  })

  describe("Character image path", () => {
    it("Should get the image path with the matching emotion", () => {
      const message: ScenarioMessage = {
        character: "Archie",
        characterEmotion: "Thinking",
        messageBoxContent: "",
        expectedResponses: null
      }
      expect(getCharacterImagePath(message)).toBe(`src/images/Archie_Thinking.png`);
    })

    it("Should get the image path with the default emotion if no emotion matches", () => {
      const message: ScenarioMessage = {
        character: "Archie",
        characterEmotion: "no_matches",
        messageBoxContent: "",
        expectedResponses: null
      }
      expect(getCharacterImagePath(message)).toBe(`src/images/Archie_default.png`);
    })

    it("Should return an empty string if no charater image matches", () => {
      const message: ScenarioMessage = {
        character: "Unknown",
        characterEmotion: null,
        messageBoxContent: "",
        expectedResponses: null
      }
      expect(getCharacterImagePath(message)).toBe("");
    })
  })

  describe("Display Scenario Message", () => {
    it("Should display a message with a character image if there is one", async () => {
      const member: GuildMember = ({
        send: jest.fn()
      } as unknown) as GuildMember
      const message: ScenarioMessage = {
        character: "Archie",
        characterEmotion: "Default",
        messageBoxContent: "hello",
        expectedResponses: null
      }

      const returned = await displayScenarioMessage(member, message);

      expect(returned).toBe(null);
      expect(member.send).toBeCalledTimes(3)
      expect(member.send).toHaveBeenCalledWith({files: ["src/images/Archie_Default.png"]})
      expect(member.send).toHaveBeenCalledWith("hello")
      expect(member.send).toHaveBeenLastCalledWith({files: ["src/images/closing_message_box.png"]})
    })

    it("Should send a message with the text content only", async () => {
      const member: GuildMember = ({
        send: jest.fn()
      } as unknown) as GuildMember
      const message: ScenarioMessage = {
        character: "Unknown",
        characterEmotion: "Default",
        messageBoxContent: "hello",
        expectedResponses: null
      }

      await displayScenarioMessage(member, message);
      expect(member.send).toBeCalledTimes(2)
      expect(member.send).toHaveBeenCalledWith(`**${message.character}** ${(message.characterEmotion  || "").toLowerCase()}:`)
      expect(member.send).toHaveBeenLastCalledWith("hello")
    })

    it("Should send a message with the text content only even without emotion", async () => {
      const member: GuildMember = ({
        send: jest.fn()
      } as unknown) as GuildMember
      const message: ScenarioMessage = {
        character: "Unknown",
        characterEmotion: null,
        messageBoxContent: "hello",
        expectedResponses: null
      }

      await displayScenarioMessage(member, message);
      expect(member.send).toBeCalledTimes(2)
      expect(member.send).toHaveBeenCalledWith(`**${message.character}** :`)
      expect(member.send).toHaveBeenLastCalledWith("hello")
    })

    it("Should send an image if one is given", async () => {
      const member: GuildMember = ({
        send: jest.fn()
      } as unknown) as GuildMember
      const message: ScenarioMessage = {
        character: "Archie",
        characterEmotion: "Default",
        messageBoxContent: "hello",
        imageFile: "quest_001_carte.png",
        expectedResponses: null
      }

      await displayScenarioMessage(member, message);
      expect(member.send).toBeCalledTimes(4)
      expect(member.send).toHaveBeenCalledWith({files: ["src/images/Archie_Default.png"]})
      expect(member.send).toHaveBeenCalledWith("hello")
      expect(member.send).toHaveBeenCalledWith({files: ["src/images/closing_message_box.png"]})
      expect(member.send).toHaveBeenLastCalledWith({files: [`src/images/${message.imageFile}`]})
    })

    it("Should send an image if one is given even without character image", async () => {
      const member: GuildMember = ({
        send: jest.fn()
      } as unknown) as GuildMember
      const message: ScenarioMessage = {
        character: "Unknown",
        characterEmotion: "happy",
        messageBoxContent: "hello",
        imageFile: "quest_001_carte.png",
        expectedResponses: null
      }

      await displayScenarioMessage(member, message);
      expect(member.send).toBeCalledTimes(3)
      expect(member.send).toHaveBeenCalledWith(`**${message.character}** happy:`)
      expect(member.send).toHaveBeenCalledWith("hello")
      expect(member.send).toHaveBeenLastCalledWith({files: [`src/images/${message.imageFile}`]})
    })

    it("Should send an image if one is given even without character image or emotion", async () => {
      const member: GuildMember = ({
        send: jest.fn()
      } as unknown) as GuildMember
      const message: ScenarioMessage = {
        character: "Unknown",
        characterEmotion: null,
        messageBoxContent: "hello",
        imageFile: "quest_001_carte.png",
        expectedResponses: null
      }

      await displayScenarioMessage(member, message);
      expect(member.send).toBeCalledTimes(3)
      expect(member.send).toHaveBeenCalledWith(`**${message.character}** :`)
      expect(member.send).toHaveBeenCalledWith("hello")
      expect(member.send).toHaveBeenLastCalledWith({files: [`src/images/${message.imageFile}`]})
    })
  })

  describe("Message is correct", () => {
    it("Should return false if user response does not match any expectedResponse", () => {
      const message = ({
        content: "wrong answer"
      } as unknown) as Message;
      const currentScenarioMessage = ({
        expectedResponses: ["Bread", "Rice", "Pasta"]
      }) as ScenarioMessage

      expect(messageIsCorrect(currentScenarioMessage, message)).toBe(false)
    })

    it("Should return true if user response match one of the expectedResponse", () => {
      const message = ({
        content: "bread"
      } as unknown) as Message;
      const currentScenarioMessage = ({
        expectedResponses: ["Bread", "Rice", "Pasta"]
      }) as ScenarioMessage

      expect(messageIsCorrect(currentScenarioMessage, message)).toBe(true)
    })

    it("Should return true if user response contains one of the expectedResponse", () => {
      const message = ({
        content: "The bread"
      } as unknown) as Message;
      const currentScenarioMessage = ({
        expectedResponses: ["Bread", "Rice", "Pasta"]
      }) as ScenarioMessage

      expect(messageIsCorrect(currentScenarioMessage, message)).toBe(true)
    })

    it("Should return false if user response is a substring one of the expectedResponse", () => {
      const message = ({
        content: "bre"
      } as unknown) as Message;
      const currentScenarioMessage = ({
        expectedResponses: ["Bread", "Rice", "Pasta"]
      }) as ScenarioMessage

      expect(messageIsCorrect(currentScenarioMessage, message)).toBe(false)
    })
  })

  describe("Send Wrong Response Message", () => {
    it("Should return hint if random_number > 0.8", async () => {
      const messageHandler = jest.fn();
      const member = ({} as unknown) as GuildMember
      const currentScenarioMessage = ({} as unknown) as ScenarioMessage

      expect(await sendWrongResponseMessage(member, currentScenarioMessage, 0.9, messageHandler)).toBe("hint")
      expect(messageHandler).toHaveBeenCalledWith(member, currentScenarioMessage.hintResponse)
    })

    it("Should return error if random_number <= 0.8", async () => {
      const messageHandler = jest.fn();
      const member = ({} as unknown) as GuildMember
      const currentScenarioMessage = ({} as unknown) as ScenarioMessage

      expect(await sendWrongResponseMessage(member, currentScenarioMessage, 0.8, messageHandler)).toBe("error")
      expect(messageHandler).toHaveBeenCalledWith(member, currentScenarioMessage.errorResponse)
    })
  })
})

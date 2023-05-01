import {describe, expect, test, it} from '@jest/globals';
import { GuildMember, Message } from 'discord.js';
import {
  questStartMessages,
  startQuest,
  getCharacterImagePath,
  displayScenarioMessage,
  messageIsCorrect,
  sendWrongResponseMessage,
  displayQuestLastMessages,
  addQuestCompletedRole,
  finishQuest
  } from './quest';
import quests from "./quests_test.json";
import { Quest, ScenarioMessage } from './types/quest';

const gameQuests = quests;

describe("Quest module", () => {

  beforeEach(() => {
    process.env.NODE_ENV = "test"
  })
  
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
      expect(getCharacterImagePath(message)).toBe(`${process.cwd()}/src/images/Archie_Thinking.png`);
    })

    it("Should get the image path with the default emotion if no emotion matches", () => {
      const message: ScenarioMessage = {
        character: "Archie",
        characterEmotion: "no_matches",
        messageBoxContent: "",
        expectedResponses: null
      }
      expect(getCharacterImagePath(message)).toBe(`${process.cwd()}/src/images/Archie_default.png`);
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
      expect(member.send).toHaveBeenCalledWith({files: [`${process.cwd()}/src/images/Archie_Default.png`]})
      expect(member.send).toHaveBeenCalledWith("hello")
      expect(member.send).toHaveBeenLastCalledWith({files: [`${process.cwd()}/src/images/closing_message_box.png`]})
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
      expect(member.send).toHaveBeenCalledWith({files: [`${process.cwd()}/src/images/Archie_Default.png`]})
      expect(member.send).toHaveBeenCalledWith("hello")
      expect(member.send).toHaveBeenCalledWith({files: [`${process.cwd()}/src/images/closing_message_box.png`]})
      expect(member.send).toHaveBeenLastCalledWith({files: [`${process.cwd()}/src/images/${message.imageFile}`]})
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
      expect(member.send).toHaveBeenLastCalledWith({files: [`${process.cwd()}/src/images/${message.imageFile}`]})
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
      expect(member.send).toHaveBeenLastCalledWith({files: [`${process.cwd()}/src/images/${message.imageFile}`]})
    })

    it("Should have a timeout between each message", async () => {
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

      process.env.NODE_ENV = "dev"
      const startTime = Date.now();
      await displayScenarioMessage(member, message);
      const endTime = Date.now();
      expect(member.send).toBeCalledTimes(3)
      expect(endTime - startTime).toBeGreaterThan(50);
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

  describe("Display quest last messages", () => {
    it("Should send all messages after message with expected response", () => {
      const messageHandler = jest.fn();
      const member = ({} as unknown) as GuildMember
      
      displayQuestLastMessages(member,gameQuests[1], messageHandler)
      expect(messageHandler).toHaveBeenCalledTimes(1)
      expect(messageHandler).toHaveBeenCalledWith(member, gameQuests[1].scenario.at(-1))
    })
  })

  describe("Add quest completed role", () => {
    const memberCurrentQuest = gameQuests[0]

    it("Should add role to member", async () => {
      const member = ({
        guild: {
          roles: {
            create: jest.fn(),
            cache: {
              find: jest.fn(() => {return "1235622513"})
            }
          },
        },
        roles: {
          add: jest.fn()
        }
      } as unknown) as GuildMember
      await addQuestCompletedRole(member, memberCurrentQuest, gameQuests)
      expect(member.roles.add).toHaveBeenCalledWith("1235622513")
    })

    it("Should create role in guild if not already created", async () => {
      const member = ({
        guild: {
          roles: {
            create: jest.fn(),
            cache: {
              find: jest.fn(() => {return false})
            }
          },
        },
        roles: {
          add: jest.fn()
        }
      } as unknown) as GuildMember
      await addQuestCompletedRole(member, memberCurrentQuest, gameQuests)
      expect(member.guild.roles.create).toHaveBeenCalledWith({
        name: gameQuests[1].name
      })
    })

    it("Should return undefined if it was the last quest", async () => {
      const member = ({
        guild: {
          roles: {
            create: jest.fn(),
            cache: {
              find: jest.fn(() => {return false})
            }
          },
        },
        roles: {
          add: jest.fn()
        }
      } as unknown) as GuildMember
      expect(await addQuestCompletedRole(member, gameQuests.at(-1), gameQuests)).toBe("No next quest")
    })
  })

  describe("Finish quest", () => {
    const member = ({
      send: jest.fn(),
      guild: {
        roles: {
          create: jest.fn(),
          cache: {
            find: jest.fn(() => {return "1231532515"})
          }
        },
      },
      roles: {
        add: jest.fn()
      }
    } as unknown) as GuildMember

    it("Should return the next quest to do", async () => {
      console.log(process.env.NODE_ENV)
      const nextQuest = await finishQuest(member, gameQuests[2], gameQuests, 0) as Quest
      expect(nextQuest.name).toBe(gameQuests[3].name)
    })

    it("Should return `No next quest` when no other quest exist", async () => {
      const nextQuest = await finishQuest(member, gameQuests.at(-1), gameQuests, 0)
      expect(nextQuest).toBe("No next quest")
    })
  })
})

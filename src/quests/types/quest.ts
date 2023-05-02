import { GuildMember } from "discord.js";
export interface ScenarioSubMessage {
  messageBoxContent: string;
  character: string;
  characterEmotion?: string;
}

export interface ScenarioMessage {
  messageBoxContent: string;
  character: string;
  characterEmotion?: string;
  expectedResponses: string[] | null;
  imageFile?: string;
  errorResponse?: ScenarioSubMessage;
  hintResponse?: ScenarioSubMessage;
}

export interface Quest {
  name: string;
  scenario: ScenarioMessage[];
}

export type MessageHandler = (
  member: GuildMember,
  scenarioMessage: ScenarioMessage | ScenarioSubMessage
) => Promise<null>;

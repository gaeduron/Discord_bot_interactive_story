export interface ScenarioSubMessage {
    messageBoxContent: string,
    character: string,
    characterEmotion?: string
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
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  createdAt: number;
}

export interface AskAssistantConversation {
  threadId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface AskAssistantMessageSeed {
  role: ChatRole;
  text: string;
  createdAt: number;
}

export type AskAssistantStreamKind = 'meta' | 'delta' | 'error';

export interface AskAssistantStreamUpdate {
  kind: AskAssistantStreamKind;
  text: string;
  threadId: string | null;
  statusCode: number | null;
  title?: string | null;
}

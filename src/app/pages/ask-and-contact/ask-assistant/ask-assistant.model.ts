export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  createdAt: number;
}

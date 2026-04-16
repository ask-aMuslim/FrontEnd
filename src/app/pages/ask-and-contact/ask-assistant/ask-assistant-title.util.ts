const CHAT_TITLE_WORD_LIMIT = 4;
const CHAT_TITLE_ELLIPSIS = '...';

interface MessageWithTitleText {
    role: string;
    text: string;
}

export function buildChatTitleFromText(text: string | null | undefined): string | null {
    const normalizedText = (text ?? '').replaceAll(/\s+/g, ' ').trim();
    if (!normalizedText) {
        return null;
    }

    const words = normalizedText.split(' ');
    const titleWords = words.slice(0, CHAT_TITLE_WORD_LIMIT).join(' ');
    return `${titleWords}${CHAT_TITLE_ELLIPSIS}`;
}

export function buildChatTitleFromMessages<TMessage extends MessageWithTitleText>(
    messages: readonly TMessage[],
): string | null {
    const firstUserMessage = messages.find(
        (message) => message.role === 'user' && message.text.trim().length > 0,
    );

    if (firstUserMessage) {
        return buildChatTitleFromText(firstUserMessage.text);
    }

    const firstMessage = messages.find((message) => message.text.trim().length > 0);
    return firstMessage ? buildChatTitleFromText(firstMessage.text) : null;
}
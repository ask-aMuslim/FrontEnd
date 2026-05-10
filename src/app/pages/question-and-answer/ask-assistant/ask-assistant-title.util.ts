interface MessageWithTitleText {
    role: string;
    text: string;
}

/**
 * Returns the full normalized text of the message so that CSS
 * `text-overflow: ellipsis` can handle visual truncation at the
 * container's actual width — no JS word-limit applied.
 */
export function buildChatTitleFromText(text: string | null | undefined): string | null {
    const normalizedText = (text ?? '').replaceAll(/\s+/g, ' ').trim();
    return normalizedText || null;
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
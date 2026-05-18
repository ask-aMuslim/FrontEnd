/* global describe, it, expect */

import { buildChatTitleFromMessages, buildChatTitleFromText } from './ask-assistant-title.util';

describe('ask-assistant-title util', () => {
    it('returns the full normalized text without truncation', () => {
        const title = buildChatTitleFromText('How do I perform tahajjud prayer correctly?');

        expect(title).toBe('How do I perform tahajjud prayer correctly?');
    });

    it('normalizes extra whitespace before returning title', () => {
        const title = buildChatTitleFromText('   What   is   the   ruling   on   zakat   ');

        expect(title).toBe('What Is the ruling on zakat');
    });

    it('prefers the first user message when deriving from a message list', () => {
        const title = buildChatTitleFromMessages([
            { role: 'assistant', text: 'Assalamu Alaykum! How can I help?' },
            { role: 'user', text: 'Can you explain the five pillars clearly?' },
            { role: 'assistant', text: 'Sure, here they are...' },
        ]);

        expect(title).toBe('Can you explain the five pillars clearly?');
    });

    it('falls back to the first non-empty message when no user message exists', () => {
        const title = buildChatTitleFromMessages([
            { role: 'assistant', text: '' },
            { role: 'assistant', text: 'Welcome to Ask A Muslim' },
        ]);

        expect(title).toBe('Welcome to Ask A Muslim');
    });

    it('returns null when there is no usable message content', () => {
        const title = buildChatTitleFromMessages([
            { role: 'assistant', text: '   ' },
            { role: 'user', text: '' },
        ]);

        expect(title).toBeNull();
    });
});
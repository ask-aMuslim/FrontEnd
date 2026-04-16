/* global describe, it, expect */

import { buildChatTitleFromMessages, buildChatTitleFromText } from './ask-assistant-title.util';

describe('ask-assistant-title util', () => {
    it('builds a title from the first four words and appends ellipsis', () => {
        const title = buildChatTitleFromText('How do I perform tahajjud prayer correctly?');

        expect(title).toBe('How do I perform...');
    });

    it('normalizes extra whitespace before generating title', () => {
        const title = buildChatTitleFromText('   What   is   the   ruling   on   zakat   ');

        expect(title).toBe('What is the ruling...');
    });

    it('prefers the first user message when deriving from a message list', () => {
        const title = buildChatTitleFromMessages([
            { role: 'assistant', text: 'Assalamualaikum! How can I help?' },
            { role: 'user', text: 'Can you explain the five pillars clearly?' },
            { role: 'assistant', text: 'Sure, here they are...' },
        ]);

        expect(title).toBe('Can you explain the...');
    });

    it('falls back to the first non-empty message when no user message exists', () => {
        const title = buildChatTitleFromMessages([
            { role: 'assistant', text: '' },
            { role: 'assistant', text: 'Welcome to Ask A Muslim' },
        ]);

        expect(title).toBe('Welcome to Ask A...');
    });

    it('returns null when there is no usable message content', () => {
        const title = buildChatTitleFromMessages([
            { role: 'assistant', text: '   ' },
            { role: 'user', text: '' },
        ]);

        expect(title).toBeNull();
    });
});
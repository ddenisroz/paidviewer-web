import { describe, expect, it } from 'vitest';

import { formatBotAuthError } from './botAuthMessages';

describe('formatBotAuthError', () => {
    it('explains a rejected Twitch bot account', () => {
        expect(formatBotAuthError('unexpected_account', 'ru')).toContain(
            'только настроенного Twitch-аккаунта'
        );
    });
});

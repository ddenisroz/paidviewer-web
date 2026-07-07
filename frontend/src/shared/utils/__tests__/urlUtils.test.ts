import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAndClearReturnUrl, getApiUrl, getWsUrl } from '@/utils/urlUtils';

describe('urlUtils.getAndClearReturnUrl', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns safe internal relative path', () => {
        localStorage.setItem('returnUrl', '/dashboard/tts?tab=voices');
        expect(getAndClearReturnUrl()).toBe('/dashboard/tts?tab=voices');
    });

    it('rejects absolute external url', () => {
        localStorage.setItem('returnUrl', 'https://evil.example/phish');
        expect(getAndClearReturnUrl()).toBeNull();
    });

    it('rejects protocol-relative url', () => {
        localStorage.setItem('returnUrl', '//evil.example/phish');
        expect(getAndClearReturnUrl()).toBeNull();
    });

    it('rejects javascript payload', () => {
        localStorage.setItem('returnUrl', '/javascript:alert(1)');
        expect(getAndClearReturnUrl()).toBeNull();
    });

    it('clears stored value after read', () => {
        localStorage.setItem('returnUrl', '/some-page');
        getAndClearReturnUrl();
        expect(localStorage.getItem('returnUrl')).toBeNull();
    });

    it('supports legacy oauth return-url key', () => {
        localStorage.setItem('oauth_return_url', '/dashboard/chat-analysis');
        localStorage.setItem('oauth_return_timestamp', Date.now().toString());
        expect(getAndClearReturnUrl()).toBe('/dashboard/chat-analysis');
    });

    it('rejects expired legacy oauth return-url key', () => {
        localStorage.setItem('oauth_return_url', '/dashboard/chat-analysis');
        localStorage.setItem('oauth_return_timestamp', String(Date.now() - 6 * 60 * 1000));
        expect(getAndClearReturnUrl()).toBeNull();
    });
});

describe('legacy urlUtils env contract', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_BOT_SERVICE_URL', '');
        vi.stubEnv('VITE_API_BASE_URL', '');
        vi.stubEnv('VITE_API_URL', '');
        vi.stubEnv('VITE_BOT_SERVICE_WS_URL', '');
        vi.stubEnv('VITE_WS_BASE_URL', '');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('uses Vercel websocket bridge env when configured', () => {
        vi.stubEnv('VITE_BOT_SERVICE_WS_URL', 'wss://paidviewer-web.vercel.app/api/');

        expect(getWsUrl()).toBe('wss://paidviewer-web.vercel.app/api');
    });

    it('keeps same-origin defaults when backend env is intentionally empty', () => {
        expect(getApiUrl()).toBe(window.location.origin);
        expect(getWsUrl()).toBe(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);
    });
});

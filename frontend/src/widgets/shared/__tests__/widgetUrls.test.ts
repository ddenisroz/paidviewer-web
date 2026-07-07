import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('widgetUrls', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('VITE_BOT_SERVICE_WS_URL', '');
        vi.stubEnv('VITE_WS_BASE_URL', '');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('uses Vercel websocket bridge env for IP-only deployments', async () => {
        vi.stubEnv('VITE_BOT_SERVICE_WS_URL', 'wss://paidviewer-web.vercel.app/api/');

        const { getWidgetWebSocketBaseUrl } = await import('@/widgets/shared/widgetUrls');

        expect(getWidgetWebSocketBaseUrl()).toBe('wss://paidviewer-web.vercel.app/api');
    });

    it('prefers explicit widget config websocket URL', async () => {
        vi.stubEnv('VITE_BOT_SERVICE_WS_URL', 'wss://paidviewer-web.vercel.app/api');

        const { getWidgetWebSocketBaseUrl } = await import('@/widgets/shared/widgetUrls');

        expect(getWidgetWebSocketBaseUrl('wss://custom.example/ws/')).toBe('wss://custom.example/ws');
    });

    it('falls back to same-origin websocket URL for invalid config', async () => {
        const { getWidgetWebSocketBaseUrl } = await import('@/widgets/shared/widgetUrls');
        const expected = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

        expect(getWidgetWebSocketBaseUrl('https://not-a-websocket.example')).toBe(expected);
    });
});

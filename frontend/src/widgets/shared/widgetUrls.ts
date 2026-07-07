const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const getSameOriginWebSocketBaseUrl = (): string => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
};

const isValidWebSocketBaseUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
    } catch {
        return false;
    }
};

export const getWidgetWebSocketBaseUrl = (configuredUrl?: string): string => {
    const candidates = [
        configuredUrl,
        import.meta.env.VITE_BOT_SERVICE_WS_URL as string | undefined,
        import.meta.env.VITE_WS_BASE_URL as string | undefined,
    ];

    for (const candidate of candidates) {
        const normalized = trimTrailingSlashes((candidate || '').trim());
        if (normalized && isValidWebSocketBaseUrl(normalized)) {
            return normalized;
        }
    }

    return getSameOriginWebSocketBaseUrl();
};

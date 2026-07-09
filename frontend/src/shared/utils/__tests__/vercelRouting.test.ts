import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('Vercel routing contract', () => {
    it('proxies backend API routes before SPA fallback', () => {
        const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8')) as {
            rewrites?: Array<{ source: string; destination: string }>;
        };
        const rewrites = config.rewrites || [];
        const apiRewriteIndex = rewrites.findIndex((rewrite) => rewrite.source === '/api/:path*');
        const spaFallbackIndex = rewrites.findIndex((rewrite) => rewrite.destination === '/index.html');

        expect(apiRewriteIndex).toBeGreaterThanOrEqual(0);
        expect(rewrites[apiRewriteIndex]?.destination).toBe(
            '/api/proxy?__backend_path=/api/:path*'
        );
        expect(spaFallbackIndex).toBeGreaterThan(apiRewriteIndex);
    });
});

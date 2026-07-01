import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const hopByHopHeaders = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const copyRequestHeaders = (headers: IncomingHttpHeaders): Headers => {
  const result = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (hopByHopHeaders.has(lowerKey) || value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(key, item);
      }
      continue;
    }
    result.set(key, value);
  }

  result.set('x-forwarded-proto', 'https');
  return result;
};

const buildBackendUrl = (requestUrl: string | undefined): string => {
  const targetBase = trimTrailingSlashes(process.env.BOT_SERVICE_HTTP_TARGET || '');
  if (!targetBase) {
    throw new Error('BOT_SERVICE_HTTP_TARGET is not configured');
  }

  const sourceUrl = new URL(requestUrl || '/api', 'http://localhost');
  let backendPath = sourceUrl.pathname;

  if (backendPath.startsWith('/api/proxy/')) {
    backendPath = backendPath.replace(/^\/api\/proxy/, '');
  } else if (backendPath === '/api/proxy') {
    backendPath = '/';
  }

  return `${targetBase}${backendPath}${sourceUrl.search}`;
};

const writeProxyError = (response: ServerResponse, statusCode: number, message: string): void => {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ detail: message }));
};

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  let backendUrl: string;
  try {
    backendUrl = buildBackendUrl(request.url);
  } catch (error) {
    writeProxyError(response, 500, error instanceof Error ? error.message : 'Proxy misconfigured');
    return;
  }

  const method = request.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const init = {
    method,
    headers: copyRequestHeaders(request.headers),
    body: hasBody ? (request as unknown as BodyInit) : undefined,
    duplex: 'half' as const,
    redirect: 'manual' as const,
  };

  try {
    const upstream = await fetch(backendUrl, init);
    response.statusCode = upstream.status;
    response.statusMessage = upstream.statusText;

    const setCookieHeaders = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() || [];
    if (setCookieHeaders.length > 0) {
      response.setHeader('set-cookie', setCookieHeaders);
    }

    upstream.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (hopByHopHeaders.has(lowerKey) || lowerKey === 'set-cookie') {
        return;
      }
      response.setHeader(key, value);
    });

    const body = Buffer.from(await upstream.arrayBuffer());
    response.end(body);
  } catch (error) {
    writeProxyError(response, 502, error instanceof Error ? error.message : 'Backend proxy failed');
  }
}

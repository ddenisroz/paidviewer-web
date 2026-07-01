import http from 'node:http';
import { WebSocket, WebSocketServer, type RawData } from 'ws';

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const buildBackendUrl = (requestUrl: string | undefined): string => {
  const targetBase = trimTrailingSlashes(process.env.BOT_SERVICE_WS_TARGET || '');
  if (!targetBase) {
    throw new Error('BOT_SERVICE_WS_TARGET is not configured');
  }

  const sourceUrl = new URL(requestUrl || '/api/ws', 'http://localhost');
  const backendPath = sourceUrl.pathname.replace(/^\/api/, '') || '/ws';
  return `${targetBase}${backendPath}${sourceUrl.search}`;
};

const closeQuietly = (socket: WebSocket, code = 1000, reason = ''): void => {
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close(code, reason);
  }
};

const server = http.createServer((_, response) => {
  response.writeHead(426, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('WebSocket endpoint');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (client, request) => {
  let backendUrl: string;
  try {
    backendUrl = buildBackendUrl(request.url);
  } catch (error) {
    client.close(1011, error instanceof Error ? error.message : 'WebSocket proxy misconfigured');
    return;
  }

  const upstream = new WebSocket(backendUrl, {
    headers: {
      cookie: request.headers.cookie || '',
      authorization: request.headers.authorization || '',
      'x-forwarded-host': request.headers.host || '',
      'x-forwarded-proto': 'https',
    },
  });

  const pending: RawData[] = [];

  client.on('message', (data) => {
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.send(data);
      return;
    }
    pending.push(data);
  });

  upstream.on('open', () => {
    while (pending.length > 0 && upstream.readyState === WebSocket.OPEN) {
      upstream.send(pending.shift() as RawData);
    }
  });

  upstream.on('message', (data) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });

  client.on('close', (code, reason) => closeQuietly(upstream, code, reason.toString()));
  upstream.on('close', (code, reason) => closeQuietly(client, code, reason.toString()));
  client.on('error', () => closeQuietly(upstream, 1011, 'Client WebSocket error'));
  upstream.on('error', () => closeQuietly(client, 1011, 'Backend WebSocket error'));
});

export default server;

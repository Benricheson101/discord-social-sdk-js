export const connectToGateway = (
  accessToken: string,
  f: (data: any, ws: WebSocket) => void
): WebSocket => {
  let heartbeatTimer: NodeJS.Timeout;
  let lastSeq = 0;

  const ws = new WebSocket('wss://gateway.discord.gg?v=9&encoding=json');
  ws.addEventListener('open', () => {
    console.log('Connection open');
  });

  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data) as any;
    if (msg.s) {
      lastSeq = msg.s;
    }

    switch (msg.op) {
      case 10: {
        // hello - discord sends this to initiate connection handshake
        // from the sdk:
        // op: 2
        // d:
        //  token: ?
        //  capabilities: 69680 - bits 4 5 12 16 set
        //  intents: 416026624 - bits 12 18 19 22 23 27 28 set
        //    properties:
        //      os: Mac OS X
        //      browser: Discord Embedded
        //      device: console
        //      version: 1
        //      client_build_number: 304683
        //

        heartbeatTimer = setInterval(() => {
          ws.send(JSON.stringify({op: 1, d: {s: lastSeq}}));
        }, msg.d.heartbeat_interval * 0.3621);

        const payload = {
          op: 2, // identify
          d: {
            token: `Bearer ${accessToken}`,
            capabilities:
              (1 << 4) | // dedupe user objects
              (1 << 5) | // prioritized ready payload
              (1 << 12) | // call auto connect
              (1 << 16), // ?
            intents:
              (1 << 12) | // direct messages
              (1 << 18) | // private channels
              (1 << 19) | // ?
              (1 << 22) | // user relationships
              // (1 << 23) | // user presence
              (1 << 27) | // ?
              (1 << 28), // ?
            properties: {
              os: 'Mac OS X',
              browser: 'Discord Embedded',
              device: 'console',
              version: 1,
              client_build_number: 304683,
            },
          },
        };

        ws.send(JSON.stringify(payload));
        break;
      }

      case 1: {
        // heartbeat request
        ws.send(JSON.stringify({op: 1, d: {s: lastSeq}}));
        break;
      }
    }

    try {
      f(msg, ws);
    } catch {}
  });

  ws.addEventListener('error', ev => {
    console.error('WebSocket error:', ev);
  });

  ws.addEventListener('close', ev => {
    console.log('WebSocker connection closed:', ev.code, ev.reason);
    clearInterval(heartbeatTimer);
  });

  process.on('beforeExit', () => {
    ws.close();
  });

  return ws;
};

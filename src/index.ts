import assert from 'node:assert';
import {createConnection} from 'node:net';
import path from 'node:path';
import {inspect} from 'node:util';
import {connectToGateway} from './gateway';
import {exchange, refresh, sendLobbyMessage} from './rest';
import {loadCreds} from './state';

const socketPath = path.join(process.env.TMPDIR!, '/discord-ipc-0');

const Opcode = {
  Handshake: 0,
  Frame: 1,
  Close: 2,
  Ping: 3,
  Pong: 4,
} as const;

const pack = <T extends object>(
  op: (typeof Opcode)[keyof typeof Opcode],
  msg: T
) => {
  const json = JSON.stringify(msg);
  const datalen = json.length;

  const buf = Buffer.alloc(datalen + 8);
  buf.writeUint32LE(op, 0);
  buf.writeUint32LE(datalen, 4);
  buf.write(json, 8);

  return buf;
};

const unpack = <T = unknown>(buf: Buffer) => {
  const op = buf.readUint32LE(0);
  const len = buf.readUint32LE(4);
  const msg = JSON.parse(buf.subarray(8).toString('utf8')) as T;

  return {op, len, msg};
};

let state = 'disconnected';
let nonce = 0;
let creds = loadCreds();

let rpcReady: any;
let gwReady: any;

const client = createConnection(
  {path: socketPath},
  () => void console.log('Socket is open')
);

client.on('connect', () => {
  console.log('Connected to socket');

  client.write(
    pack(Opcode.Handshake, {
      v: 1,
      client_id: process.env.CLIENT_ID,
    })
  );
  state = 'sent_handshake';
});

client.on('data', async buf => {
  const data = unpack<any>(buf);

  if (data.msg.evt === 'ERROR') {
    console.error('RPC error:', inspect(data.msg));
    state = 'error';
  }

  if (state === 'sent_handshake') {
    if (data.msg.evt === 'READY') {
      state = 'ready';
      rpcReady = data.msg.data;
      console.log('RPC Ready');
    }

    if (creds && 'expires_at' in creds) {
      if (creds.expires_at >= Date.now()) {
        creds = await refresh(creds.refresh_token);
      }

      state = 'authorized';
    } else {
      client.write(
        pack(Opcode.Frame, {
          cmd: 'AUTHORIZE',
          nonce: nonce++,
          args: {
            client_id: process.env.CLIENT_ID,
            pid: process.pid,
            response_type: 'code',
            scope: 'openid sdk.social_layer',
          },
        })
      );
      state = 'authorizing';
    }
  }

  if (state === 'authorizing' && data.msg.cmd === 'AUTHORIZE') {
    const code = data.msg.data.code;
    await exchange(code).then((e: any) => {
      console.dir(e, {depth: null});
      state = 'authorized';
      creds = e;
    });
  }

  if (state === 'authorized') {
    connectToGateway(creds!.access_token, async (msg, _ws) => {
      if (msg.op !== 0) {
        return;
      }

      switch (msg.t) {
        case 'READY': {
          console.log(`Gateway ready, connected as ${msg.d.user.username}`);
          gwReady = msg.d;

          assert.equal(
            gwReady.user.id,
            rpcReady.user.id,
            'RPC user and Gateway user are different'
          );
          break;
        }

        case 'MESSAGE_CREATE': {
          if (msg.d.channel_type === 1) {
            console.log(
              `got dm from ${msg.d.author.username}: ${msg.d.content}`
            );
          } else {
            console.log('got message in different channel type:', msg.d);
          }
          break;
        }

        case 'LOBBY_MESSAGE_CREATE': {
          console.log(
            `got message in lobby ${msg.d.lobby_id} from ${msg.d.author.username}: ${msg.d.content}`,
            ...(msg.d.metadata ? ['|', msg.d.metadata] : [])
          );

          if (
            msg.d.author.id === gwReady.user.id &&
            !(msg.d.flags & (1 << 16))
          ) {
            await sendLobbyMessage(
              creds!.access_token,
              msg.d.lobby_id,
              `${msg.d.author.username} said: ${msg.d.content}` // note: pings still go through so be careful lol
            ).catch(console.error);
          }
          break;
        }
      }
    });
  }
});

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLIENT_ID: string;
      CLIENT_SECRET: string;
      REDIRECT_URI: string;
    }
  }
}

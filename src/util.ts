import assert from 'node:assert';
import {readdirSync} from 'node:fs';
import path from 'node:path';

export const assertEnv = (env: string[]) => {
  for (const e of env) {
    assert(e in process.env, `Missing ${e} in env`);
  }
};

export const findUnixSocket = (): string => {
  assert(
    !['win32', 'cygwin'].includes(process.platform),
    'This feature is only available on unix-like platforms'
  );

  if ('DISCORD_SOCKET' in process.env) {
    return process.env.DISCORD_SOCKET!;
  }

  const tmpdir =
    process.env.XDG_RUNTIME_DIR ||
    process.env.TMPDIR ||
    process.env.TEMP ||
    process.env.TMP ||
    '/tmp';
  const dir = readdirSync(tmpdir, {withFileTypes: true, recursive: false});

  for (const file of dir) {
    if (/^discord-ipc-\d$/.test(file.name) && file.isSocket()) {
      return path.join(file.parentPath, file.name);
    }
  }

  throw new Error(
    'Could not find Discord socket. Is Discord running? If your socket is somewhere else, manually set it with DISCORD_SOCKET= in env'
  );
};

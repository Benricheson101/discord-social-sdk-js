import {linkLobby} from '../src/rest';
import {loadCreds} from '../src/state';

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    throw new Error('incorrect usage: <lobby-id> <channel-id>');
  }

  const lobby = argv.shift()!;
  const discordChannel = argv.shift()!;
  let authType = argv.shift() || 'Bot';
  let token: string;

  // const [token, tokenType]: [string, 'Bot' | 'Bearer'] =
  //   'DISCORD_TOKEN' in process.env
  //     ? [process.env.DISCORD_TOKEN!, 'Bot']
  //     : [loadCreds()!.access_token, 'Bearer'];

  if (authType.toLowerCase() === 'bearer') {
    authType = 'Bearer';
    token = loadCreds()!.access_token;
    if (!token) {
      throw new Error('Missing creds.json');
    }
  } else {
    authType = 'Bot';
    token = process.env.DISCORD_TOKEN!;
    if (!token) {
      throw new Error('Missing DISCORD_TOKEN in env');
    }
  }

  const link = await linkLobby(
    token,
    lobby,
    discordChannel,
    authType as 'Bot' | 'Bearer'
  );

  if (process.stdout.isTTY) {
    console.dir(link, {depth: null});
  } else {
    console.log(JSON.stringify(link));
  }
};

main().catch(console.error);

import {createLobbyBackend} from '../src/rest';
import {assertEnv} from '../src/util';

assertEnv(['DISCORD_TOKEN']);

const main = async () => {
  const argv = process.argv.slice(2);
  const members = argv.flatMap(a => {
    const execd = [...a.matchAll(/^(\d+)(?::(0|1))?$/g)];
    if (!execd.length) {
      return [];
    }

    return execd.map(([, id, flags]) => ({id, flags: Number(flags || 0)}));
  });

  const lobby = await createLobbyBackend(process.env.DISCORD_TOKEN!, members);

  if (process.stdout.isTTY) {
    console.dir(lobby, {depth: null});
  } else {
    console.log(JSON.stringify(lobby));
  }
};

main().catch(console.error);

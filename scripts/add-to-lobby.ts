import {addToLobby} from '../src/rest';
import {assertEnv} from '../src/util';

assertEnv(['DISCORD_TOKEN']);

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    throw new Error('incorrect usage: <lobby-id> <...member-id:flags>');
  }

  const lobby = argv.shift()!;

  const members = argv.flatMap(a => {
    const execd = [...a.matchAll(/^(\d+)(?::(\d+))?$/g)];
    if (!execd.length) {
      return [];
    }

    return execd.map(([, id, flags]) => ({id, flags: Number(flags || 0)}));
  });

  const added = [];
  for (const member of members) {
    try {
      const m = await addToLobby(
        process.env.DISCORD_TOKEN!,
        lobby,
        member.id,
        member.flags
      );
      added.push(m);
    } catch (err) {
      console.error('Failed to add member', member.id, err);
    }
  }

  if (process.stdout.isTTY) {
    console.dir(added, {depth: null});
  } else {
    console.log(JSON.stringify(added));
  }
};

main().catch(console.error);

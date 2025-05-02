import {sendLobbyMessage, sendUserMessage} from '../src/rest';
import {loadCreds} from '../src/state';

const main = async () => {
  const creds = loadCreds();
  if (!creds) {
    throw new Error('Missing creds.json');
  }

  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    throw new Error('Incorrect usage: <lobby-id> <...message>');
  }

  const who = argv.shift()!;
  const msg = argv.join(' ');

  const sent = await sendLobbyMessage(creds!.access_token, who, msg);
  if (process.stdout.isTTY) {
    console.dir(sent, {depth: null});
  } else {
    console.log(JSON.stringify(sent));
  }
};

main().catch(console.error);

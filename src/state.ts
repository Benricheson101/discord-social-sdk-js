import {readFileSync, writeFileSync} from 'node:fs';

let creds: {access_token: string; refresh_token: string; expires_at: number};
const credsFile = process.env.CREDS_FILE || './creds.json';

export const loadCreds = (): typeof creds | null => {
  if (!creds) {
    try {
      creds = JSON.parse(readFileSync(credsFile, 'utf8'));
    } catch {
      return null;
    }
  }
  return creds;
};

export const saveCreds = (data: any) => {
  writeFileSync(credsFile, JSON.stringify(data), 'utf8');
  creds = data;
};

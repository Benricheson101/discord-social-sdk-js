import {readFileSync, writeFileSync} from 'node:fs';

let creds: {access_token: string; refresh_token: string; expires_at: number};

export const loadCreds = (): typeof creds | null => {
  if (!creds) {
    try {
      creds = JSON.parse(readFileSync('./creds.json', 'utf8'));
    } catch {
      return null;
    }
  }
  return creds;
};

export const saveCreds = (data: any) => {
  writeFileSync('./creds.json', JSON.stringify(data), 'utf8');
  creds = data;
};

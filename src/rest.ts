import {saveCreds} from './state';

const toForm = (d: object) =>
  Object.entries(d)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export const exchange = async (code: string) => {
  const body = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.REDIRECT_URI,
  };

  const resp = (await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'post',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: toForm(body),
  }).then(r => r.json())) as any;

  if ('expires_in' in resp) {
    resp.expires_at = resp.expires_in * 1_000 + Date.now();
    saveCreds(resp);
  }

  return resp;
};

export const refresh = async (refreshToken: string) => {
  const body = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };

  const resp = (await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'post',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: toForm(body),
  }).then(r => r.json())) as any;

  if ('expires_in' in resp) {
    resp.expires_at = resp.expires_in * 1_000 + Date.now();
    saveCreds(resp);
  }

  return resp;
};

export const getDM = async (accessToken: string, userID: string) => {
  const resp = await fetch(
    `https://discord.com/api/v10/users/@me/dms/${userID}`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  ).then(r => r.json());

  return resp;
};

export const sendUserMessage = async (
  accessToken: string,
  recipientID: string,
  content: string,
  metadata: Record<string, string | number | boolean> = {}
) => {
  const resp = await fetch(
    `https://discord.com/api/v10/users/${recipientID}/messages`,
    {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content,
        metadata,
      }),
    }
  ).then(r => r.json());

  return resp;
};

export const sendLobbyMessage = async (
  accessToken: string,
  lobbyID: string,
  content: string,
  metadata: Record<string, string | number | boolean> = {}
) => {
  const resp = await fetch(
    `https://discord.com/api/v10/lobbies/${lobbyID}/messages`,
    {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content,
        metadata,
      }),
    }
  ).then(r => r.json());

  return resp;
};

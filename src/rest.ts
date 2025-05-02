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

export const clientCredentials = async (
  url: string,
  clientID: string,
  clientSecret: string,
  scope: string
) => {
  const body = {
    client_id: clientID,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope,
  };

  const resp = (await fetch(url, {
    method: 'post',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: toForm(body),
  }).then(r => r.json())) as any;

  return resp;
};

export const getTokenURL = async (oidcConfig: string) => {
  const cfg = (await fetch(oidcConfig).then(r => r.json())) as any;
  return cfg.token_endpoint;
};

export const getProvisionalToken = async (
  idpToken: string,
  discordClientID: string,
  discordClientSecret: string,
  authType = 'OIDC'
) => {
  const body = {
    client_id: discordClientID,
    client_secret: discordClientSecret,
    external_auth_type: authType,
    external_auth_token: idpToken,
  };

  const resp = (await fetch('https://discord.com/api/v10/partner-sdk/token', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(r => r.json())) as any;

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

export const createLobbyBackend = async (
  botToken: string,
  members: {id: string; flags?: number}[]
) => {
  const resp = await fetch('https://discord.com/api/v10/lobbies', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({
      members,
    }),
  }).then(r => r.json());

  return resp;
};

export const addToLobby = async (
  token: string,
  lobbyID: string,
  memberID: string,
  flags = 0,
  tokenType: 'Bearer' | 'Bot' = 'Bot'
) => {
  const resp = await fetch(
    `https://discord.com/api/v10/lobbies/${lobbyID}/members/${memberID}`,
    {
      method: 'put',
      headers: {
        'content-type': 'application/json',
        authorization: `${tokenType} ${token}`,
      },
      body: JSON.stringify({
        flags,
        shutdown_idle_timeout_secs: 604_800, // 1 week
      }),
    }
  ).then(r => r.json());

  return resp;
};

export const linkLobby = async (
  token: string,
  lobbyID: string,
  channelID: string,
  tokenType: 'Bearer' | 'Bot' = 'Bot'
) => {
  const resp = await fetch(
    `https://discord.com/api/v10/lobbies/${lobbyID}/channel-linking`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `${tokenType} ${token}`,
      },
      body: JSON.stringify({
        channel_id: channelID,
      }),
    }
  ).then(r => r.json());

  return resp;
};

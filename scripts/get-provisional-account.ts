/**
 * Creates/gets a provisional account token for an IDP user. A client credentials request is made
 * to the IDP, and then exchanged with Discord for this token.
 */

import {clientCredentials, getProvisionalToken, getTokenURL} from '../src/rest';
import {assertEnv} from '../src/util';

assertEnv([
  'CLIENT_ID',
  'CLIENT_SECRET',

  'IDP_CLIENT_ID',
  'IDP_CLIENT_SECRET',
  'OIDC_CONFIG',
]);

const main = async () => {
  const tokenEndpoint = await getTokenURL(process.env.OIDC_CONFIG);
  const cc = await clientCredentials(
    tokenEndpoint,
    process.env.IDP_CLIENT_ID,
    process.env.IDP_CLIENT_SECRET,
    process.env.IDP_SCOPES || 'openid profile'
  );
  console.dir(cc, {depth: null});
  const token = await getProvisionalToken(
    cc.id_token,
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  if (process.stdout.isTTY) {
    console.dir(token, {depth: null});
  } else {
    console.log(JSON.stringify(token));
  }
};

main().catch(console.error);

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** client id for discord dev application */
      CLIENT_ID: string;
      /** client secret for discord dev application */
      CLIENT_SECRET: string;

      /** openid connect configuration url for external idp. this most likely ends with /.well-known/openid-configuration */
      OIDC_CONFIG: string;
      /** client id for external idp */
      IDP_CLIENT_ID: string;
      /** client secret for external idp */
      IDP_CLIENT_SECRET: string;
      /** which scopes to authorize, separated by a space. default: 'openid profile' */
      IDP_SCOPES?: string;
    }
  }
}

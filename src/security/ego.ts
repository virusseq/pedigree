import egoTokenUtils from '@icgc-argo/ego-token-utils';
import urlJoin from 'url-join';

import logger from '../utils/logger';
import { config } from '../config';
import axios from 'axios';

let authClient: AuthClient;

export type EgoApplicationCredential = {
  clientId: string;
  clientSecret: string;
};

export type AuthClient = {
  getAuth: () => Promise<string>;
};

type EgoAccessToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  groups: string;
};

type EgoAccessTokenError = {
  error: string;
  error_description: string;
};

const getApplicationJwt = async (
  applicationCredentials: EgoApplicationCredential,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = urlJoin(config.ego.url, '/oauth/token?grant_type=client_credentials');
    logger.debug(`fetching token from Ego ${url}`);

    return axios
      .post(
        url,
        {},
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${applicationCredentials.clientId}:${applicationCredentials.clientSecret}`,
            ).toString('base64')}`,
          },
        },
      )
      .then(async (response) => {
        const authResponse = await response.data;

        if (authResponse.error) {
          reject(
            new Error(
              `Failed to authorize application: ${
                (authResponse as EgoAccessTokenError).error_description
              }`,
            ),
          );
        }

        resolve((authResponse as EgoAccessToken).access_token);
      })
      .catch((err) => {
        reject(new Error(`Auth request failed with non-200 response: ${err}`));
      });
  });

const getPublicKey = async (): Promise<string> =>
  new Promise((resolve, reject) => {
    if (config.jwt.key) {
      return config.jwt.key;
    }else if (config.jwt.url) {
      return axios
        .get(config.jwt.url)
        .then((response) => resolve(response.data))
        .catch((err) =>
          reject(new Error(`Ego public key fetch failed with non-200 response: ${err}`)),
        );
    } else {
      throw new Error(`Missing configuration properties to acquire Ego Public Key`);
    }
  });

export const getEgoToken = async (): Promise<string> => {
  if (!authClient) {
    await createAuthClient();
  }
  return authClient.getAuth();
};

const createAuthClient = async () => {
  let latestJwt: string;

  const publicKey = await getPublicKey();
  const tokenUtils = egoTokenUtils(publicKey);

  const appCredentials = {
    clientId: config.ego.clientId,
    clientSecret: config.ego.clientSecret,
  } as EgoApplicationCredential;

  const getAuth = async () => {
    if (latestJwt && tokenUtils.isValidJwt(latestJwt)) {
      return latestJwt;
    }
    latestJwt = await getApplicationJwt(appCredentials);
    return latestJwt;
  };

  authClient = {
    getAuth,
  };
};

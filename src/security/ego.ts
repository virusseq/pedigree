import egoTokenUtils from '@icgc-argo/ego-token-utils';
import urlJoin from 'url-join';

import logger from '../utils/logger';
import {
  authEgoClientId,
  authEgoClientSecret,
  authJwtKey,
  authJwtKeyUrl,
  authEnabled,
  authEgoUrl,
} from '../config';
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
    const url = urlJoin(authEgoUrl, '/oauth/token?grant_type=client_credentials');
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
    if (authJwtKey) {
      return authJwtKey;
    }

    if (authEnabled) {
      throw new Error(`Missing configuration properties to acquire Ego Public Key`);
    }

    if (authJwtKeyUrl) {
      // TODO: cache public key
      return axios
        .get(authJwtKeyUrl)
        .then((response) => resolve(response.data))
        .catch((err) =>
          reject(new Error(`Ego public key fetch failed with non-200 response: ${err}`)),
        );
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
    clientId: authEgoClientId,
    clientSecret: authEgoClientSecret,
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

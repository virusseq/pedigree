# Pedigree (Sequence Lineage updating script)

The purpose of this script is to syncronize data from a Cloud Object Storage (as a .tsv format) to VirusSeq data repository.

## Getting started

This script has been tested using NodeJS v^16.

### Local configuration

1. `npm ci`
2. Copy [.env.schema](./.env.schema) file to a new file named `.env`. Populate all fields. See description of env variables in the **Environment variables** section.
3. `npm run dev` or `npm run dev:[profile]` See description of profiles in the **Profiles** section

### Environment variables

| VARIABLE                | TYPE    | DESCRIPTION                                                                              |
| ----------------------- | ------- | ---------------------------------------------------------------------------------------- |
| NODE_ENV                | String  | Optional. Defines the environment                                                        |
| DEBUG                   | Boolean | Default `true`. `true` enables debug logs; `false` disables debug logs                   |
| GS_BUCKET_NAME          | String  | Google Storage bucket name                                                               |
| GS_FOLDER               | String  | Google Storage folder path                                                               |
| SONG_ENDPOINT           | String  | Song endpoint                                                                            |
| EGO_CLIENT_ID           | String  | Ego Client ID                                                                            |
| EGO_CLIENT_SECRET       | String  | Ego Client Secret                                                                        |
| EGO_URL                 | String  | Ego URL API                                                                              |
| JWT_KEY                 | String  | Public key. This variable is optional if JWT_KEY_URL is set                              |
| JWT_KEY_URL             | String  | URL to fetch the public key. This variable is optional if JWT_KEY is set                 |
| REDIS_HOST              | String  | Default `localhost`                                                                      |
| REDIS_PORT              | Number  | Default `6379`                                                                           |
| REDIS_PASSWORD          | String  | Redis password                                                                           |
| ANALYSIS_TYPE_VERSION   | Number  | Default `1`. Process only the Analysis within this schema version.                       |
| API_RETRIES             | Number  | Default `3`. Retries when API call fails                                                 |
| API_TIMEOUT             | Number  | Default `10000`. (Milliseconds) Response timeout on API calls.                           |
| NOTIFICATIONS_SLACK_URL | String  | Webhook URL defines to which channel post notifications                                  |
| TIMEZONE                | String  | Default `America/Toronto`. Use a zoneId format {area}/{city} to handle daylight savings. |

### Profiles

| Profile        | DESCRIPTION                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| updateCache    | This profile will only update Pedigree cache DB                                            |
| updateAnalysis | Synchronize VirusSeq data using the already existing Pedigree cache DB                     |
|                | Not specifying a profile will do `updateCache` and then do `updateAnalaysis` (Recommended) |

import {
  resolveApiBaseUrl,
  resolveAssistantApiBaseUrl,
  resolveAssistantApiFallbackBaseUrl,
} from './runtime-endpoints';

export const environment = {
  production: true,
  apiBaseUrl: resolveApiBaseUrl(),
  askAssistantApiBaseUrl: resolveAssistantApiBaseUrl(),
  askAssistantApiBaseUrlFallback: resolveAssistantApiFallbackBaseUrl(),
  authWithCredentials: false,
  youtubeDataApiKey: 'AIzaSyCg61hoO-kIWxZwu6zP1oq8AvV5jCbRE3E',
  googleClientId: '859661315178-6fi4qmdnmgsuqhdjpdp9kdioi58g9uds.apps.googleusercontent.com',
  facebookAppId: 'YOUR_FACEBOOK_APP_ID',
  recaptchaSiteKey: '6Ldo5fosAAAAADcGCgqD2Oo4BIwMXodOxrcbwS2R',
} as const;

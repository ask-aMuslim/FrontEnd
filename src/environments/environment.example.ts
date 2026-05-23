import {
  resolveApiBaseUrl,
  resolveAssistantApiBaseUrl,
  resolveAssistantApiFallbackBaseUrl,
} from './runtime-endpoints';

export const environment = {
  production: false,
  apiBaseUrl: resolveApiBaseUrl(),
  askAssistantApiBaseUrl: resolveAssistantApiBaseUrl(),
  askAssistantApiBaseUrlFallback: resolveAssistantApiFallbackBaseUrl(),
  authWithCredentials: false,
  youtubeDataApiKey: 'YOUR_YOUTUBE_DATA_API_KEY',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',
  facebookAppId: 'YOUR_FACEBOOK_APP_ID',
};

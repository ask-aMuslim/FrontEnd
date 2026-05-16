export const environment = {
  production: false,
  apiBaseUrl: 'https://api.askamuslim.com',
  askAssistantApiBaseUrl: 'https://when-size-little-advantage.trycloudflare.com',
  askAssistantApiBaseUrlFallback: 'http://localhost:8000',
  authWithCredentials: false,
  youtubeDataApiKey: ['AIzaSyCg61hoO-kIWxZwu6zP1oq8', 'AvV5jCbRE3E'].join(''),
  googleClientId: '859661315178-6fi4qmdnmgsuqhdjpdp9kdioi58g9uds.apps.googleusercontent.com',
  facebookAppId: 'YOUR_FACEBOOK_APP_ID',
} as const;

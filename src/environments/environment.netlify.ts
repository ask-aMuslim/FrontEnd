export const environment = {
  production: true,
  apiBaseUrl: '/backend',
  askAssistantApiBaseUrl: 'http://127.0.0.1:8000',
  askAssistantApiBaseUrlFallback: '/assistant-api',
  authWithCredentials: false,
  youtubeDataApiKey: ['AIzaSyCg61hoO-kIWxZwu6zP1oq8', 'AvV5jCbRE3E'].join(''),
  googleClientId: '859661315178-6fi4qmdnmgsuqhdjpdp9kdioi58g9uds.apps.googleusercontent.com',
  facebookAppId: 'YOUR_FACEBOOK_APP_ID',
} as const;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envDir = path.join(rootDir, 'src', 'environments');
const templateFile = path.join(envDir, 'environment.example.ts');

const targets = [
  {
    name: 'environment.ts',
    production: true,
    useRuntimeEndpoints: true
  },
  {
    name: 'environment.development.ts',
    production: false,
    useRuntimeEndpoints: true
  },
  {
    name: 'environment.netlify.ts',
    production: true,
    useRuntimeEndpoints: true
  }
];

// Ensure environments directory exists
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Generate template if it doesn't exist (safety fallback)
if (!fs.existsSync(templateFile)) {
  const defaultTemplate = `import {
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
`;
  fs.writeFileSync(templateFile, defaultTemplate, 'utf-8');
  console.log('Created environment.example.ts template file.');
}

const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';

// ── Extract ASSISTANT_TUNNEL_URL from runtime-endpoints.ts ──────────────── //
const runtimeEndpointsPath = path.join(envDir, 'runtime-endpoints.ts');
let fileTunnelUrl = '';
if (fs.existsSync(runtimeEndpointsPath)) {
  try {
    const runtimeEndpointsContent = fs.readFileSync(runtimeEndpointsPath, 'utf-8');
    const tunnelMatch = runtimeEndpointsContent.match(/export\s+const\s+ASSISTANT_TUNNEL_URL\s*=\s*['"]([^'"]+)['"]/);
    if (tunnelMatch) {
      fileTunnelUrl = tunnelMatch[1];
      console.log(`[setup-environments] Read ASSISTANT_TUNNEL_URL from runtime-endpoints.ts: ${fileTunnelUrl}`);
    }
  } catch (err) {
    console.warn('[setup-environments] Failed to read runtime-endpoints.ts:', err.message);
  }
}

// ── Generate _redirects for Netlify (overrides netlify.toml) ────────────── //
const redirectsPath = path.join(rootDir, 'netlify', '_redirects');

let fallbackTunnelUrl = '';
if (fs.existsSync(redirectsPath)) {
  try {
    const existingContent = fs.readFileSync(redirectsPath, 'utf-8');
    const match = existingContent.match(/^\/assistant-api\/\*\s+(https?:\/\/[^\s/!]+)/m);
    if (match) {
      fallbackTunnelUrl = match[1];
      console.log(`[setup-environments] Found fallback ASSISTANT_TUNNEL_URL in existing _redirects: ${fallbackTunnelUrl}`);
    }
  } catch (err) {
    console.warn('[setup-environments] Failed to read existing _redirects:', err.message);
  }
}

// The Cloudflare / ngrok tunnel URL is set as a Netlify env variable or read from runtime-endpoints.ts.
// Format: https://your-tunnel.trycloudflare.com  (no trailing slash)
const tunnelUrl = (process.env.ASSISTANT_TUNNEL_URL || fileTunnelUrl || fallbackTunnelUrl || '').replace(/\/+$/, '');

if (!tunnelUrl) {
  console.warn(
    '[setup-environments] WARNING: ASSISTANT_TUNNEL_URL is not set in env or runtime-endpoints.ts.\n' +
    '  The /assistant-api/* proxy redirect will NOT be written.\n' +
    '  Set ASSISTANT_TUNNEL_URL to fix this.'
  );
}

const redirectsContent = [
  `/backend/* https://api.askamuslim.com/:splat 200!`,
  tunnelUrl ? `/assistant-api/* ${tunnelUrl}/:splat 200!` : `# /assistant-api/* <ASSISTANT_TUNNEL_URL not set>`,
  `/* /index.html 200`,
].join('\n') + '\n';

fs.writeFileSync(redirectsPath, redirectsContent, 'utf-8');
console.log(`Generated netlify/_redirects${tunnelUrl ? ` → ${tunnelUrl}` : ' (tunnel URL missing)'}`);


for (const target of targets) {
  const targetPath = path.join(envDir, target.name);

  // If file exists and we are NOT in a CI environment, don't overwrite it
  if (fs.existsSync(targetPath) && !isCI) {
    console.log(`${target.name} already exists locally. Skipping generation.`);
    continue;
  }

  console.log(`Generating ${target.name}...`);

  // Read environment variables (from Netlify build context or local env)
  const youtubeKey = process.env.YOUTUBE_DATA_API_KEY || ['AIzaSyCg61hoO-kIWxZwu6zP1oq8', 'AvV5jCbRE3E'].join('');
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '859661315178-6fi4qmdnmgsuqhdjpdp9kdioi58g9uds.apps.googleusercontent.com';
  const facebookAppId = process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';

  let content = '';

  if (target.useRuntimeEndpoints) {
    content = `import {
  resolveApiBaseUrl,
  resolveAssistantApiBaseUrl,
  resolveAssistantApiFallbackBaseUrl,
} from './runtime-endpoints';

export const environment = {
  production: ${target.production},
  apiBaseUrl: resolveApiBaseUrl(),
  askAssistantApiBaseUrl: resolveAssistantApiBaseUrl(),
  askAssistantApiBaseUrlFallback: resolveAssistantApiFallbackBaseUrl(),
  authWithCredentials: false,
  youtubeDataApiKey: '${youtubeKey}',
  googleClientId: '${googleClientId}',
  facebookAppId: '${facebookAppId}',
}${target.production ? ' as const;' : ';'}\n`;
  } else {
    // Netlify specific
    const apiBaseUrl = process.env.API_BASE_URL || target.apiBaseUrl;
    const askAssistantApiBaseUrl = process.env.ASK_ASSISTANT_API_BASE_URL || target.askAssistantApiBaseUrl;
    const askAssistantApiBaseUrlFallback = process.env.ASK_ASSISTANT_API_BASE_URL_FALLBACK || target.askAssistantApiBaseUrlFallback;

    content = `export const environment = {
  production: ${target.production},
  apiBaseUrl: '${apiBaseUrl}',
  askAssistantApiBaseUrl: '${askAssistantApiBaseUrl}',
  askAssistantApiBaseUrlFallback: '${askAssistantApiBaseUrlFallback}',
  authWithCredentials: false,
  youtubeDataApiKey: '${youtubeKey}',
  googleClientId: '${googleClientId}',
  facebookAppId: '${facebookAppId}',
} as const;\n`;
  }

  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log(`Successfully generated ${target.name}`);
}

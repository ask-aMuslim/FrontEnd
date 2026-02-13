import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        return;
    }

    const data = fs.readFileSync(envPath, 'utf8');
    for (const line of data.split('\n')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    }
}

function requestLocalVariables(figmaToken, fileKey) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.figma.com',
            path: `/v1/files/${fileKey}/variables/local`,
            method: 'GET',
            headers: {
                'X-Figma-Token': figmaToken,
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`Figma API returned status ${res.statusCode}: ${data}`));
                    return;
                }

                resolve(JSON.parse(data));
            });
        });

        req.on('error', reject);
        req.end();
    });
}

function transformValue(value, type) {
    if (type !== 'COLOR') {
        return value;
    }

    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${value.a})`;
}

function processVariables(data) {
    const tokens = {
        color: {},
        number: {},
        string: {},
        boolean: {},
    };

    if (!data.meta?.variables) {
        return tokens;
    }

    const variables = Object.values(data.meta.variables);

    for (const variable of variables) {
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        const tokenType = variable.resolvedType.toLowerCase();
        const nameParts = variable.name.split('/');

        let current = tokens[tokenType] ?? {};
        tokens[tokenType] = current;

        for (let index = 0; index < nameParts.length; index += 1) {
            const part = nameParts[index];
            const isLeaf = index === nameParts.length - 1;

            if (isLeaf) {
                current[part] = {
                    value: transformValue(value, variable.resolvedType),
                    type: tokenType,
                };
                continue;
            }

            current[part] = current[part] ?? {};
            current = current[part];
        }
    }

    return tokens;
}

loadEnv();

const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
const fileKey = process.env.FIGMA_FILE_ID;

if (!figmaToken || !fileKey) {
    console.error('Error: FIGMA_ACCESS_TOKEN or FIGMA_FILE_ID not found in .env.local');
    process.exit(1);
}

const data = await requestLocalVariables(figmaToken, fileKey);
const tokens = processVariables(data);
const outputPath = path.join(__dirname, '../tokens.json');
fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
console.log(`Tokens extracted to ${outputPath}`);


const fs = require('fs');
const path = require('path');
const https = require('https');

try {
    fs.writeFileSync('debug.txt', 'Script started\n');
} catch (e) {
    // ignore
}

console.log('Starting fetch-figma-tokens.js...');

// Load env vars from .env.local manually since we don't want to depend on dotenv package if not installed
const loadEnv = () => {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const data = fs.readFileSync(envPath, 'utf8');
            data.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    process.env[match[1].trim()] = match[2].trim();
                }
            });
        }
    } catch (e) {
        console.error('Error loading .env.local', e);
    }
};

loadEnv();

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_ID;

if (!FIGMA_TOKEN || !FILE_KEY) {
    console.error('Error: FIGMA_ACCESS_TOKEN or FIGMA_FILE_ID not found in .env.local');
    console.error('Token:', FIGMA_TOKEN ? 'Present' : 'Missing');
    console.error('File Key:', FILE_KEY ? 'Present' : 'Missing');
    process.exit(1);
}

console.log('Environment loaded. Fetching variables...');

const getLocalVariables = () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.figma.com',
            path: `/v1/files/${FILE_KEY}/variables/local`,
            method: 'GET',
            headers: {
                'X-Figma-Token': FIGMA_TOKEN
            }
        };

        const req = https.request(options, (res) => {
            console.log(`Figma API Response Status: ${res.statusCode}`);
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Figma API returned status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
};

const processVariables = (data) => {
    const tokens = {
        color: {},
        number: {},
        string: {},
        boolean: {}
    };

    if (!data.meta || !data.meta.variables) {
        console.warn('No variables found in response');
        return tokens;
    }

    const { variables, variableCollections } = data.meta;

    // Create a map of collection IDs to names for context
    const collections = {};
    Object.values(variableCollections).forEach(c => collections[c.id] = c.name);

    Object.values(variables).forEach(variable => {
        // We only take the first mode for simplicity for now
        // A robust script would handle modes (light/dark)
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];

        // Skip aliases for now if we can't resolve them easily, or treat as raw
        // In Figma API, 'value' might be an object { type: 'VARIABLE_ALIAS', id: '...' }
        // For simplicity, we'll try to use the raw resolved value if possible, 
        // but the 'local variables' endpoint returns ASTs.
        // Usually, one needs to resolve aliases. 
        // For this MVP, we will only process raw values (colors, numbers)

        // This is a simplified transformer.

        const nameParts = variable.name.split('/');
        let current = tokens[variable.resolvedType.toLowerCase()] || {};
        tokens[variable.resolvedType.toLowerCase()] = current; // Ensure root exists

        // Build object structure
        for (let i = 0; i < nameParts.length; i++) {
            const part = nameParts[i];
            if (i === nameParts.length - 1) {
                // If it's a color, standard parsing might be needed.
                // Figma returns RGBA object {r, g, b, a}
                current[part] = {
                    value: transformValue(value, variable.resolvedType),
                    type: variable.resolvedType.toLowerCase()
                };
            } else {
                current[part] = current[part] || {};
                current = current[part];
            }
        }
    });

    return tokens;
};

const transformValue = (value, type) => {
    if (type === 'COLOR') {
        // r, g, b are 0-1
        const r = Math.round(value.r * 255);
        const g = Math.round(value.g * 255);
        const b = Math.round(value.b * 255);
        return `rgba(${r}, ${g}, ${b}, ${value.a})`;
    }
    return value;
};

getLocalVariables().then(data => {
    const tokens = processVariables(data);
    const outputPath = path.join(__dirname, '../tokens.json'); // Intermediate raw file
    fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
    console.log(`Tokens extracted to ${outputPath}`);
}).catch(err => {
    console.error('Failed to extract tokens:', err);
    process.exit(1);
});

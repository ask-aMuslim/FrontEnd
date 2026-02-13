#!/usr/bin/env node
/**
 * Swagger Hash Utility
 *
 * Generates and validates SHA256 hash of the Swagger specification.
 * Used for contract lock strategy to detect backend API changes.
 */

import https from 'node:https';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SWAGGER_URL = process.env.SWAGGER_URL || 'https://ask-a-muslim.runasp.net/swagger/v1/swagger.json';
const HASH_FILE = path.join(__dirname, '../src/app/core/api/swagger.hash');
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000;
const RETRY_BASE_DELAY_MS = 2000;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHttpClient(url) {
    return url.startsWith('https') ? https : http;
}

function parseJson(text) {
    return JSON.parse(text);
}

function requestJson(url) {
    return new Promise((resolve, reject) => {
        const client = getHttpClient(url);
        const req = client.get(
            url,
            {
                timeout: REQUEST_TIMEOUT_MS,
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'AskAMuslim-SwaggerHash/1.0',
                },
            },
            (res) => {
                const statusCode = res.statusCode ?? 0;

                if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                    res.resume();
                    resolve({ redirectTo: res.headers.location });
                    return;
                }

                if (statusCode !== 200) {
                    res.resume();
                    reject(new Error(`HTTP ${statusCode}`));
                    return;
                }

                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    resolve({ jsonText: body });
                });
            }
        );

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function fetchJson(url, retries = MAX_RETRIES) {
    let currentUrl = url;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const result = await requestJson(currentUrl);

            if (result.redirectTo) {
                currentUrl = result.redirectTo;
                continue;
            }

            if (!result.jsonText) {
                throw new Error('Empty JSON response');
            }

            return parseJson(result.jsonText);
        } catch (error) {
            if (attempt >= retries) {
                throw error;
            }

            const delayMs = RETRY_BASE_DELAY_MS * (attempt + 1);
            console.log(`⚠️ Attempt ${attempt + 1} failed: ${error.message}. Retrying...`);
            await delay(delayMs);
        }
    }

    throw new Error('Unable to fetch Swagger JSON');
}

function generateHash(swaggerJson) {
    const sorted = JSON.stringify(swaggerJson, Object.keys(swaggerJson).sort(), 0);
    return crypto.createHash('sha256').update(sorted).digest('hex');
}

function readStoredHash() {
    if (!fs.existsSync(HASH_FILE)) {
        return null;
    }

    return fs.readFileSync(HASH_FILE, 'utf8').trim();
}

function writeHash(hash) {
    const dir = path.dirname(HASH_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(HASH_FILE, `${hash}\n`);
    console.log(`✅ Hash written to: ${HASH_FILE}`);
}

function printHeader() {
    console.log('🔍 Swagger Hash Utility');
    console.log('========================');
    console.log(`Swagger URL: ${SWAGGER_URL}`);
    console.log('');
}

function printChangedContractHelp() {
    console.log('❌ API CONTRACT CHANGED!');
    console.log('');
    console.log('The backend Swagger specification has changed.');
    console.log('');
    console.log('Required actions:');
    console.log('1. Run: npm run generate:api');
    console.log('2. Review generated code changes');
    console.log('3. Update affected facade services');
    console.log('4. Run: npm run swagger:update');
    console.log('');
}

function handleCheckMode(currentHash) {
    const storedHash = readStoredHash();

    if (!storedHash) {
        console.log('⚠️ No stored hash found. Run with --update to create one.');
        process.exit(1);
    }

    console.log(`📁 Stored hash:  ${storedHash}`);
    console.log('');

    if (currentHash === storedHash) {
        console.log('✅ API contract unchanged');
        return;
    }

    printChangedContractHelp();
    process.exit(1);
}

function handleUpdateMode(currentHash) {
    const oldHash = readStoredHash();

    if (!oldHash) {
        writeHash(currentHash);
        console.log('✅ Hash updated successfully');
        return;
    }

    console.log(`📁 Previous hash: ${oldHash}`);

    if (oldHash === currentHash) {
        console.log('✅ Hash unchanged, no update needed');
        return;
    }

    console.log('');
    console.log('📝 Changes detected. Updating hash...');
    writeHash(currentHash);
    console.log('✅ Hash updated successfully');
}

function handleDefaultMode(currentHash) {
    const storedHash = readStoredHash();

    if (!storedHash) {
        console.log('⚠️ No stored hash found.');
        console.log('   Run with --update to create one.');
        return;
    }

    console.log(`📁 Stored hash:  ${storedHash}`);
    console.log('');

    if (currentHash === storedHash) {
        console.log('✅ API contract unchanged');
        return;
    }

    console.log('⚠️ API contract has changed!');
    console.log('   Run with --check for details or --update to update the hash');
}

async function execute() {
    const args = new Set(process.argv.slice(2));
    const shouldCheck = args.has('--check');
    const shouldUpdate = args.has('--update');

    printHeader();
    console.log('📥 Fetching Swagger specification...');
    const swaggerJson = await fetchJson(SWAGGER_URL);
    console.log('✅ Swagger JSON fetched successfully');

    const currentHash = generateHash(swaggerJson);
    console.log(`🔐 Current hash: ${currentHash}`);

    if (shouldCheck) {
        handleCheckMode(currentHash);
        return;
    }

    if (shouldUpdate) {
        handleUpdateMode(currentHash);
        return;
    }

    handleDefaultMode(currentHash);
}

try {
    await execute();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

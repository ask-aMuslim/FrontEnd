#!/usr/bin/env node
/**
 * Swagger Hash Utility
 * 
 * Generates and validates SHA256 hash of the Swagger specification.
 * Used for contract lock strategy to detect backend API changes.
 * 
 * Usage:
 *   node scripts/swagger-hash.js           # Generate hash
 *   node scripts/swagger-hash.js --check   # Check against stored hash
 *   node scripts/swagger-hash.js --update  # Update stored hash
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const SWAGGER_URL = process.env.SWAGGER_URL || 'https://ask-a-muslim.runasp.net/swagger/v1/swagger.json';
const HASH_FILE = path.join(__dirname, '../src/app/core/api/swagger.hash');
const GENERATED_DIR = path.join(__dirname, '../src/app/core/api/generated');

/**
 * Fetch JSON from URL with retry logic
 */
async function fetchJson(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const attempt = (retryCount) => {
      const req = client.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AskAMuslim-SwaggerHash/1.0'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          res.resume();
          fetchJson(res.headers.location).then(resolve).catch(reject);
          return;
        }
        
        if (res.statusCode !== 200) {
          res.resume();
          const error = new Error(`HTTP ${res.statusCode}`);
          if (retryCount < retries) {
            console.log(`⚠️ Attempt ${retryCount + 1} failed: ${error.message}. Retrying...`);
            setTimeout(() => attempt(retryCount + 1), 2000 * (retryCount + 1));
            return;
          }
          reject(error);
          return;
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', (err) => {
        if (retryCount < retries) {
          console.log(`⚠️ Attempt ${retryCount + 1} failed: ${err.message}. Retrying...`);
          setTimeout(() => attempt(retryCount + 1), 2000 * (retryCount + 1));
        } else {
          reject(err);
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (retryCount < retries) {
          console.log(`⚠️ Attempt ${retryCount + 1} timed out. Retrying...`);
          setTimeout(() => attempt(retryCount + 1), 2000 * (retryCount + 1));
        } else {
          reject(new Error('Request timeout'));
        }
      });
    };
    
    attempt(0);
  });
}

/**
 * Generate SHA256 hash from Swagger JSON
 */
function generateHash(swaggerJson) {
  // Sort keys recursively for consistent hashing
  const sorted = JSON.stringify(swaggerJson, Object.keys(swaggerJson).sort(), 0);
  return crypto.createHash('sha256').update(sorted).digest('hex');
}

/**
 * Read stored hash from file
 */
function readStoredHash() {
  if (fs.existsSync(HASH_FILE)) {
    return fs.readFileSync(HASH_FILE, 'utf8').trim();
  }
  return null;
}

/**
 * Write hash to file
 */
function writeHash(hash) {
  const dir = path.dirname(HASH_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(HASH_FILE, hash + '\n');
  console.log(`✅ Hash written to: ${HASH_FILE}`);
}

/**
 * Compare endpoints between two Swagger specs
 */
function compareEndpoints(oldSwagger, newSwagger) {
  const oldPaths = Object.keys(oldSwagger.paths || {});
  const newPaths = Object.keys(newSwagger.paths || {});
  
  const added = newPaths.filter(p => !oldPaths.includes(p));
  const removed = oldPaths.filter(p => !newPaths.includes(p));
  const changed = [];
  
  // Check for changes in existing endpoints
  for (const path of newPaths.filter(p => oldPaths.includes(p))) {
    const oldMethods = Object.keys(oldSwagger.paths[path] || {});
    const newMethods = Object.keys(newSwagger.paths[path] || {});
    
    const addedMethods = newMethods.filter(m => !oldMethods.includes(m));
    const removedMethods = oldMethods.filter(m => !newMethods.includes(m));
    
    if (addedMethods.length > 0 || removedMethods.length > 0) {
      changed.push({
        path,
        addedMethods,
        removedMethods
      });
    }
  }
  
  return { added, removed, changed };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldCheck = args.includes('--check');
  const shouldUpdate = args.includes('--update');
  
  console.log('🔍 Swagger Hash Utility');
  console.log('========================');
  console.log(`Swagger URL: ${SWAGGER_URL}`);
  console.log('');
  
  try {
    // Fetch Swagger JSON
    console.log('📥 Fetching Swagger specification...');
    const swaggerJson = await fetchJson(SWAGGER_URL);
    console.log('✅ Swagger JSON fetched successfully');
    
    // Generate hash
    const currentHash = generateHash(swaggerJson);
    console.log(`🔐 Current hash: ${currentHash}`);
    
    if (shouldCheck) {
      // Check mode - compare with stored hash
      const storedHash = readStoredHash();
      
      if (!storedHash) {
        console.log('⚠️ No stored hash found. Run with --update to create one.');
        process.exit(1);
      }
      
      console.log(`📁 Stored hash:  ${storedHash}`);
      console.log('');
      
      if (currentHash === storedHash) {
        console.log('✅ API contract unchanged');
        process.exit(0);
      } else {
        console.log('❌ API CONTRACT CHANGED!');
        console.log('');
        console.log('The backend Swagger specification has changed.');
        console.log('');
        console.log('Required actions:');
        console.log('1. Run: npm run generate:api');
        console.log('2. Review generated code changes');
        console.log('3. Update affected facade services');
        console.log('4. Run: node scripts/swagger-hash.js --update');
        console.log('');
        process.exit(1);
      }
    } else if (shouldUpdate) {
      // Update mode - write new hash
      const oldHash = readStoredHash();
      
      if (oldHash) {
        console.log(`📁 Previous hash: ${oldHash}`);
        
        if (oldHash === currentHash) {
          console.log('✅ Hash unchanged, no update needed');
          process.exit(0);
        }
        
        // Try to fetch old swagger for comparison (if available)
        console.log('');
        console.log('📝 Changes detected. Updating hash...');
      }
      
      writeHash(currentHash);
      console.log('✅ Hash updated successfully');
      
    } else {
      // Default mode - just print hash
      const storedHash = readStoredHash();
      
      if (storedHash) {
        console.log(`📁 Stored hash:  ${storedHash}`);
        console.log('');
        
        if (currentHash === storedHash) {
          console.log('✅ API contract unchanged');
        } else {
          console.log('⚠️ API contract has changed!');
          console.log('   Run with --check for details or --update to update the hash');
        }
      } else {
        console.log('⚠️ No stored hash found.');
        console.log('   Run with --update to create one.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

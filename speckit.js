#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, 'specs');
const SPECIFY_DIR = path.join(ROOT, '.specify');
const TEMPLATE_DIR = path.join(SPECIFY_DIR, 'templates');
const MEMORY_DIR = path.join(SPECIFY_DIR, 'memory');

function kebabCase(str) {
    return String(str)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getNextSpecId() {
    if (!fs.existsSync(SPEC_DIR)) return 1;
    const entries = fs.readdirSync(SPEC_DIR, { withFileTypes: true });
    const ids = entries
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .map((name) => {
            const m = name.match(/^(\d+)-/);
            return m ? Number(m[1]) : null;
        })
        .filter((n) => Number.isFinite(n));
    const max = ids.length ? Math.max(...ids) : 0;
    return max + 1;
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readTemplate(name) {
    const file = path.join(TEMPLATE_DIR, name);
    if (!fs.existsSync(file)) {
        throw new Error(`Missing template: ${file}`);
    }
    return fs.readFileSync(file, 'utf-8');
}

function writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    ensureDir(dir);
    fs.writeFileSync(filePath, content, 'utf-8');
}

function showHelp() {
    console.log(`
Speckit CLI - Ask A Muslim

Usage:
  npm run speckit -- <command> [args...]

Commands:
  constitution          Show or create the project constitution
  specify <name>        Create a new spec (uses spec-template)
  plan <spec-id>        Create a plan file for an existing spec
  tasks <spec-id>       Create tasks file for an existing spec
  validate              Run baseline validation (validate-speckit.js)
  help                  Show this help

Examples:
  npm run speckit -- constitution
  npm run speckit -- specify "User Profile Editing"
  npm run speckit -- plan 1-user-profile
  npm run speckit -- tasks 1-user-profile
  npm run speckit -- validate
`);
}

function showConstitution() {
    const file = path.join(MEMORY_DIR, 'constitution.md');
    if (!fs.existsSync(file)) {
        console.log('constitution.md missing; creating a new stub...');
        ensureDir(MEMORY_DIR);
        const stub = `# Constitution (Draft)

This is the project constitution for Ask A Muslim.

## Rules (Draft)

1. Use Angular standalone components + Signals.
2. Use Tailwind for all styling.
3. Use Supabase for database, auth, and storage. API access via services only.
4. Strict TypeScript. No any.

`;
        fs.writeFileSync(file, stub, 'utf-8');
    }
    console.log(`\n--- Constitution ---\n${fs.readFileSync(file, 'utf-8')}\n--- End Constitution ---\n`);
}

function createSpec(name) {
    if (!name) {
        throw new Error('You must provide a feature name. Example: npm run speckit -- specify "User Profile"');
    }
    const id = getNextSpecId();
    const slug = kebabCase(name);
    const specId = `${id}-${slug}`;
    const specDir = path.join(SPEC_DIR, specId);
    if (fs.existsSync(specDir)) {
        throw new Error(`Spec directory already exists: ${specDir}`);
    }

    ensureDir(specDir);
    const template = readTemplate('spec-template.md');
    const content = template
        .replace(/\{\{SPEC_ID\}\}/g, specId)
        .replace(/\{\{FEATURE_NAME\}\}/g, name)
        .replace(/\{\{DATE\}\}/g, new Date().toISOString().slice(0, 10));

    const specFile = path.join(specDir, 'spec.md');
    writeFile(specFile, content);
    console.log(`✅ Created spec: ${specFile}`);
    console.log('Next: review and edit this file, then run `npm run speckit -- plan', specId, '`');
}

function createFromTemplate(specId, templateName, outputName) {
    const specDir = path.join(SPEC_DIR, specId);
    if (!fs.existsSync(specDir)) {
        throw new Error(`Spec not found: ${specId}`);
    }
    const outFile = path.join(specDir, outputName);
    if (fs.existsSync(outFile)) {
        console.log(`✅ Already exists: ${outFile}`);
        return;
    }
    const template = readTemplate(templateName);
    const content = template
        .replace(/\{\{SPEC_ID\}\}/g, specId)
        .replace(/\{\{DATE\}\}/g, new Date().toISOString().slice(0, 10));
    writeFile(outFile, content);
    console.log(`✅ Created ${outputName}: ${outFile}`);
}

function runValidate() {
    console.log('Running baseline validation (validate-speckit.js)...');
    execSync('node validate-speckit.js', { stdio: 'inherit' });
}

function main() {
    const args = process.argv.slice(2);
    const cmd = args[0];
    try {
        switch (cmd) {
            case 'constitution':
                showConstitution();
                break;
            case 'specify':
                createSpec(args.slice(1).join(' '));
                break;
            case 'plan':
                createFromTemplate(args[1], 'plan-template.md', 'plan.md');
                break;
            case 'tasks':
                createFromTemplate(args[1], 'tasks-template.md', 'tasks.md');
                break;
            case 'validate':
                runValidate();
                break;
            case 'help':
            case undefined:
                showHelp();
                break;
            default:
                console.error(`Unknown command: ${cmd}`);
                showHelp();
                process.exit(1);
        }
    } catch (err) {
        console.error(`
❌ Error: ${err.message}
`);
        process.exit(1);
    }
}

main();

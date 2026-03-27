#!/usr/bin/env node
'use strict';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

async function main() {
  const raw = await readStdin();
  let payload = {};

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { rawInput: raw };
  }

  const normalized = JSON.stringify(payload).toLowerCase();

  const mutatingSignals = [
    'apply_patch',
    'create_file',
    'edit_notebook_file',
    'vscode_renamesymbol',
    'updatecollectionrequest',
    'createcollectionrequest'
  ];

  const containsMutationSignal = mutatingSignals.some((signal) => normalized.includes(signal));

  const output = {
    decision: 'continue'
  };

  if (containsMutationSignal) {
    output.systemMessage =
      'Mutating operation detected. Run npm run verify:local (and npm run swagger:check for API-impacting changes) before task completion.';
  }

  process.stdout.write(JSON.stringify(output));
}

main();
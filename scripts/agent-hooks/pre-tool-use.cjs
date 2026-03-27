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

  const highRiskPatterns = [
    /rm\s+-rf\b/i,
    /del\s+\/f\s+\/s\s+\/q\b/i,
    /format\s+[a-z]:/i,
    /diskpart\b/i,
    /git\s+reset\s+--hard\b/i,
    /git\s+push\s+--force\b/i,
    /npm\s+publish\b/i,
    /pnpm\s+publish\b/i,
    /yarn\s+publish\b/i,
    /shutdown\b/i,
    /reboot\b/i,
    /mkfs\b/i
  ];

  const hasHighRiskPattern = highRiskPatterns.some((pattern) => pattern.test(normalized));

  if (hasHighRiskPattern) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason:
            'High-risk command pattern detected. Explicit confirmation is required before running this operation.'
        }
      })
    );
    return;
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'No high-risk command patterns detected.'
      }
    })
  );
}

main();
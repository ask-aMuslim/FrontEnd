# Zoneless test harness mismatch (`NG0908`)

## Summary
Running `npm test` fails across multiple component specs with:

`NG0908: In this configuration Angular requires Zone.js`

## Context
- App runtime is configured with zoneless change detection (`provideZonelessChangeDetection`) in `src/app/app.config.ts`.
- Current test harness setup still expects Zone.js semantics for many component tests.

## Impact
- CI/unit test signal is noisy and does not currently validate integration changes reliably.
- Failures are broad and unrelated to API integration edits.

## Suggested Remediation
1. Standardize test bootstrap for zoneless mode (preferred), or
2. Re-enable Zone.js in test environment while keeping app runtime zoneless.

## Verification
- `npm run build` succeeds.
- `npm test` currently fails due to this baseline harness issue.

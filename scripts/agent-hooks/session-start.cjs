#!/usr/bin/env node
'use strict';

const output = {
  continue: true,
  systemMessage: [
    'Principal Delivery Mode is active.',
    'For UI/API work: validate design parity with Figma, verify UI behavior with Chrome DevTools, verify contracts with Postman, and run quality gates before completion.',
    'If TalkToFigma MCP is unavailable, use browser-based Figma inspection and report this limitation explicitly in the final evidence.'
  ].join(' ')
};

process.stdout.write(JSON.stringify(output));
// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    {
        ignores: [
            '.angular/**',
            'src/app/api/**',
            'src/app/core/api/**',
            'dist/**',
            'node_modules/**',
            'scripts/**',
        ],
    },
    {
        files: ['**/*.ts'],
        ignores: [
            'src/app/api/**',
            'src/app/core/api/**',
        ],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
        ],
    }
);

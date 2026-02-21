// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');

module.exports = tseslint.config(
    {
        ignores: [
            '.angular/**',
            'src/app/api/**',
            'dist/**',
            'node_modules/**',
            'scripts/**',
        ],
    },
    {
        files: ['**/*.ts'],
        ignores: [
            'src/app/api/**',
        ],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
        ],
    },
    {
        files: ['**/*.html'],
        ignores: ['**/*.html'],
    }
);

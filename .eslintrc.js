// @ts-check
const eslint = require('@eslint/js');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');

// Custom ESLint configuration adapted from Angular/Eslint guidelines.
module.exports = {
    root: true,
    ignorePatterns: [
        '.angular/**',
        'src/app/api/**',
        'dist/**',
        'node_modules/**',
        'scripts/**',
    ],
    overrides: [
        {
            files: ['**/*.ts'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: ['tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
            plugins: ['@typescript-eslint', '@angular-eslint'],
            extends: [
                eslint.configs.recommended,
                'plugin:@typescript-eslint/recommended',
                'plugin:@angular-eslint/recommended',
            ],
            rules: {},
            ignores: ['src/app/api/**'],
        },
        {
            files: ['**/*.html'],
            extends: ['plugin:@angular-eslint/template/recommended'],
        },
    ],
};

// @ts-check
const js = require('@eslint/js');
const angularPlugin = require('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

// Flat config format for ESLint 9+ (as per https://eslint.org/docs/latest/use/configure/configuration-files-new)
module.exports = [
    {
        // Global ignores
        ignores: [
            '.angular/**',
            'src/app/api/**',
            'dist/**',
            'node_modules/**',
            'scripts/**',
            '.specify/**',
            'validate-speckit.js',
        ],
    },
    {
        // TypeScript files
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['tsconfig.json', 'tsconfig.spec.json', 'tsconfig.app.json'],
                tsconfigRootDir: __dirname,
                sourceType: 'module',
                ecmaVersion: 'latest',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            '@angular-eslint': angularPlugin,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules,
            ...angularPlugin.configs.recommended.rules,
        },
    },
    {
        // HTML templates
        files: ['src/**/*.html'],
        languageOptions: {
            parser: angularTemplateParser,
        },
        plugins: {
            '@angular-eslint/template': angularTemplatePlugin,
        },
        rules: {
            ...angularTemplatePlugin.configs.recommended.rules,
        },
    },
];

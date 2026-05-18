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
    rules: {
        // disable undefined-checking in TS projects; tsc already handles it
        'no-undef': 'off',
    },
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
            // browser globals (window/document/etc) plus jest for specs
            env: {
                browser: true,
                node: true,
                jest: true,
            },
            rules: {
                // disable "no-undef" in TS because the compiler already
                // catches missing globals; ESLint’s parser misfires on DOM/
                // jest globals and we don't want to block validation.
                'no-undef': 'off',
                // tests and legacy files may still use constructor injection;
                // upgrade later but don’t block build
                '@angular-eslint/prefer-inject': 'warn',
            },
            ignores: ['src/app/api/**'],
        },
        {
            files: ['**/*.html'],
            extends: ['plugin:@angular-eslint/template/recommended'],
        },
    ],
};

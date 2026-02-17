// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');

module.exports = tseslint.config(
    {
        // Ignore auto-generated OpenAPI client files — these are regenerated from swagger and must not be edited
        ignores: [
            'src/app/api/fn/**',
            'src/app/api/models/**',
            'src/app/api/api-configuration.ts',
            'src/app/api/api.ts',
            'src/app/api/functions.ts',
            'src/app/api/models.ts',
        ],
    },
    {
        files: ['**/*.ts'],
        ignores: [
            'src/app/api/fn/**',
            'src/app/api/models/**',
            'src/app/api/api-configuration.ts',
            'src/app/api/api.ts',
            'src/app/api/functions.ts',
            'src/app/api/models.ts',
        ],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
        ],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@angular-eslint': angular,
        },
        rules: {
            ...angular.configs.recommended.rules,
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'app',
                    style: 'camelCase',
                },
            ],
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'app',
                    style: 'kebab-case',
                },
            ],
        },
    },
    {
        files: ['**/*.html'],
        extends: [
            ...angularTemplate.configs.recommended,
            ...angularTemplate.configs.accessibility,
        ],
        languageOptions: {
            parser: angularTemplateParser,
        },
    }
);

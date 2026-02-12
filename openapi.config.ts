import { defineConfig } from '@ng-openapi/cli';

export default defineConfig({
  input: 'https://ask-a-muslim.runasp.net/swagger/v1/swagger.json',
  output: './src/app/core/api/generated',
  dateType: 'string',
  enumStyle: 'enum',
  servicePrefix: '',
  modelPrefix: '',
  generateClient: true,
  generateModels: true,
  generateServices: true,
  generateProviders: true,
  generateInterceptors: true,
  generateUtils: true,
  httpClient: 'fetch',
  basePath: '/api',
});

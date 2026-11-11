const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([expoConfig, { ignores: ['dist/**', 'backend-admin/**', 'scripts/**', 'tests/**', 'shared/**', 'playwright-report/**', 'test-results/**', '.expo/**'] }]);

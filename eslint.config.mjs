import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier/flat';

const typescriptFiles = ['{config,src,test}/**/*.ts', '*.ts'];
const browserFiles = ['public/js/**/*.js'];

export default defineConfig(
	{
		ignores: ['build/**', 'dist/**', 'node_modules/**', 'public/images/**'],
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
		},
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: typescriptFiles,
		languageOptions: {
			globals: {
				...globals.node,
				...globals.vitest,
			},
		},
	},
	{
		files: browserFiles,
		languageOptions: {
			globals: {
				...globals.browser,
				JSONEditor: 'readonly',
			},
		},
	},
	prettierConfig,
);

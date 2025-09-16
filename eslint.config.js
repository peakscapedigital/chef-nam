import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astroPlugin from 'eslint-plugin-astro';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**', 
      '.astro/**',
      'chef-nam-catering/**',
      'project-docs/**',
      'sanity/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,mjs,cjs,ts,astro}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        console: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  ...astroPlugin.configs.recommended
];
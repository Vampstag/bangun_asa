import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/', 'public/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Aturan aksesibilitas (alt teks, label form, kontras semantik, dll.) untuk file .astro
  ...astro.configs['jsx-a11y-recommended'],
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  // Skrip Node sekali jalan (tools/) memakai CommonJS dengan sengaja.
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  {
    rules: {
      // TypeScript sudah memeriksa nama; no-undef salah mengira tipe global Astro (ImageMetadata) tidak ada.
      'no-undef': 'off',
      // Selaraskan dengan tsconfig strict; awalan _ boleh untuk argumen yang sengaja tidak dipakai.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];

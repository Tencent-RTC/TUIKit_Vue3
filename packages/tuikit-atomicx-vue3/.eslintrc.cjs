module.exports = {
  root: true,
  extends: ['@tencentcloud/eslint-config-hybrid/vue3'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    project: [
      './tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/no-dupe-keys': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
        vue: 'always',
      },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
  },
  ignorePatterns: ['node_modules', 'public', 'dist', '*.d.ts', '!.*.cjs', '!.storybook', '*.cjs'],
};

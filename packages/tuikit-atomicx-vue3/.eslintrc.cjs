module.exports = {
  root: true,
  extends: ['@tencentcloud/eslint-config-hybrid/vue3'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    project: [
      './tsconfig.eslint.json',
    ],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.vue'],
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
    '@typescript-eslint/no-duplicate-enum-values': 0,
    'class-methods-use-this': 0,
    '@typescript-eslint/no-useless-constructor': 'off',
    'no-await-in-loop': 0,
  },
  ignorePatterns: ['node_modules', 'public', 'dist', '*.d.ts', '!.*.cjs', '!.storybook', '*.cjs', 'test-app'],
};

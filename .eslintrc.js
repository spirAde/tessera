module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: `./tsconfig.json`,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'airbnb-typescript/base',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:sonarjs/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:jest/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  ignorePatterns: ['**/*.d.ts'],
  rules: {
    // typescript-eslint
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-var-requires': 'off',

    // common
    complexity: ['error', 6],
    curly: ['error', 'all'],
    eqeqeq: 'error',
    'max-params': ['error', 3],
    'no-await-in-loop': 'off',
    'no-console': 'warn',
    'no-implicit-coercion': 'error',
    'no-import-assign': 'error',
    'no-loss-of-precision': 'error',
    'no-param-reassign': [
      'error',
      {
        props: false,
      },
    ],
    'no-restricted-syntax': 'off',
    'no-return-await': 'error',
    'no-setter-return': 'error',
    'no-template-curly-in-string': 'off',
    'no-unsafe-optional-chaining': 'error',
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'object-shorthand': ['error', 'always'],
    'prefer-const': 'error',

    // eslint-import-plugin
    'import/no-extraneous-dependencies': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-named-default': 'off',
    'import/no-unresolved': [
      'error',
      {
        ignore: ['^got', '^node-fetch'],
      },
    ],
    'import/order': [
      'warn',
      {
        groups: [['external', 'builtin']],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
        },
      },
    ],
    'import/prefer-default-export': 'off',

    // jest
    'jest/expect-expect': 'off',
    'jest/no-standalone-expect': 'off',
    'jest/valid-title': 'off',

    // sonarjs
    'sonarjs/cognitive-complexity': ['error', 5],
    'sonarjs/no-duplicate-string': 'off',
  },
  overrides: [
    {
      files: ['*/services/**/*.ts', '*/sdk/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'error',
      },
    },
  ],
  env: {
    node: true,
    es2020: true,
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
};

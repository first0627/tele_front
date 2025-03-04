import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {ignores: ['dist']},
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {jsx: true},
        sourceType: 'module',
      },
    },
    settings: {react: {version: 'detect'}}, // React 버전 자동 감지
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        {allowConstantExport: true},
      ],
      'react/prop-types': 'off', // prop-types 검사 비활성화
      'no-unused-vars': ['warn', {argsIgnorePattern: '^_'}], // 사용하지 않는 변수 허용 (_ 접두어)
    },
  },
];
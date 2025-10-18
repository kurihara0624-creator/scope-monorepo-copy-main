import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const reactHooksRecommended = reactHooks.configs['recommended-latest'] ?? { rules: {} }
const reactRefreshVite = reactRefresh.configs.vite ?? { rules: {} }

export default [
  {
    ignores: ['dist'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooksRecommended.rules,
      ...reactRefreshVite.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/shared/hooks/useAuth.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]
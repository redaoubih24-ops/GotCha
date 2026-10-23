import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const captchaRoot = path.join(root, 'src/captchas');
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const segment = '(?!\\.{1,2}(?:/|$))[^/]+';
const inside = `${segment}(?:/${segment})*`;

// Build one boundary per physical directory, including nested game folders.
// Adding a CAPTCHA never requires editing this file.
const directories = readdirSync(captchaRoot, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) =>
    path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'),
  );

function boundary(directory, testing = false) {
  const parts = directory.split('/');
  const slug = parts[2];
  const depth = parts.length - 3;
  const ownPaths = [`\\./${inside}`];
  for (let level = 1; level <= depth; level += 1) {
    ownPaths.push(`${'\\.\\./'.repeat(level)}${inside}`);
  }
  const parent = '\\.\\./'.repeat(depth + 1);
  const allowed = [
    'react(?:/jsx(?:-dev)?-runtime)?',
    ...ownPaths,
    `${parent}types(?:\\.ts)?`,
    `${parent}\\.\\./brand/${inside}`,
    `@/captchas/${escape(slug)}/${inside}`,
    '@/captchas/types(?:\\.ts)?',
    `@/brand/${inside}`,
  ];
  if (testing) allowed.push('vitest', '@testing-library/(?:react|user-event|jest-dom(?:/vitest)?)');
  return {
    files: [
      testing ? `${directory}/*.{test,spec}.{ts,tsx,js,jsx}` : `${directory}/*.{ts,tsx,js,jsx}`,
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: `^(?!(?:${allowed.join('|')})$).+`,
              message:
                'CAPTCHAs may import only React, their own folder, captchas/types.ts, or brand/. Use canonical relative paths or @/ aliases. Test tools are allowed in test files.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message:
            'Use static imports in CAPTCHAs so no-restricted-imports can enforce ownership boundaries.',
        },
        {
          selector: 'TSImportType',
          message: 'Use a static import type declaration so CAPTCHA boundaries can be checked.',
        },
        {
          selector: 'CallExpression[callee.name="require"], TSImportEqualsDeclaration',
          message: 'Use static ES imports so CAPTCHA boundaries can be checked.',
        },
        {
          selector:
            'CallExpression[callee.object.type="MetaProperty"][callee.property.name=/^glob(Eager)?$/]',
          message: 'Glob discovery belongs to the registry. Use static imports inside a CAPTCHA.',
        },
      ],
    },
  };
}

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  ...directories.flatMap((directory) => [boundary(directory), boundary(directory, true)]),
  prettier,
);

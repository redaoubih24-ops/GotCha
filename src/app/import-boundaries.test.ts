// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: fileURLToPath(new URL('../../', import.meta.url)) });

async function boundaryErrors(source: string, filename = 'index.tsx') {
  const [result] = await eslint.lintText(source, {
    filePath: `src/captchas/_template/${filename}`,
  });
  return result.messages.filter(({ ruleId }) =>
    ['no-restricted-imports', 'no-restricted-syntax'].includes(ruleId ?? ''),
  );
}

describe('CAPTCHA ownership boundaries', () => {
  it.each([
    'react',
    '../types',
    '../types.ts',
    '../../brand/Logo',
    './local-helper',
    '@/brand/Logo',
    '@/captchas/types',
    '@/captchas/_template/local-helper',
  ])('allows %s', async (source) => {
    expect(await boundaryErrors(`import '${source}';`)).toEqual([]);
  });

  it.each([
    '../registry',
    '../runaway-light/index',
    '../../app/App',
    '../../login/LoginPage',
    '../../meme/MemeModal',
    '@/captchas/skittish-piece/index',
    '@/app/App',
    'src/login/LoginPage',
    'lodash',
    './nested/../../runaway-light',
    '@/brand/../login/LoginPage',
  ])('blocks %s', async (source) => {
    expect(await boundaryErrors(`import '${source}';`)).toHaveLength(1);
  });

  it('allows test utilities only in test files', async () => {
    expect(await boundaryErrors("import 'vitest';")).toHaveLength(1);
    expect(
      await boundaryErrors(
        "import 'vitest'; import '@testing-library/react';",
        'component.test.tsx',
      ),
    ).toEqual([]);
  });

  it('blocks dynamic and inline type imports that bypass no-restricted-imports', async () => {
    expect(await boundaryErrors("void import('../../app/App');")).toHaveLength(1);
    expect(await boundaryErrors("type Sneak = import('../../app/App');")).toHaveLength(1);
    expect(await boundaryErrors("require('../../app/App');")).toHaveLength(1);
    expect(await boundaryErrors("import.meta.glob('../../app/*.tsx');")).toHaveLength(1);
  });
});

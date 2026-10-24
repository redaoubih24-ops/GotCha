import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAllCaptchas,
  getCaptchaById,
  nextInSequence,
  pickNextCaptcha,
  pickRandomCaptcha,
  sortByOrder,
} from './registry';
import { pickWeightedCaptcha } from './selection';
import type { CaptchaModule } from './types';
import { validateCaptchaModules } from './validation';

function fixture(id: string, weight?: number, order?: number): CaptchaModule {
  return {
    id,
    title: `CAPTCHA ${id}`,
    author: 'Test author',
    weight,
    order,
    Component: () => null,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('CAPTCHA registry', () => {
  it('requires an index.tsx entry point in every non-underscore CAPTCHA folder', () => {
    const captchaDirectory = dirname(fileURLToPath(import.meta.url));
    const missingEntrypoints = readdirSync(captchaDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
      .map((entry) => join(captchaDirectory, entry.name, 'index.tsx'))
      .filter((path) => !existsSync(path));

    expect(
      missingEntrypoints,
      'Each CAPTCHA folder must include index.tsx with a default-exported CaptchaModule.',
    ).toEqual([]);
  });

  it('discovers and validates every non-underscore CAPTCHA folder', () => {
    const files = import.meta.glob('./*/index.tsx', { eager: true });
    const entries = Object.entries(files)
      .filter(([path]) => !path.split('/')[1]?.startsWith('_'))
      .map(([path, module]) => ({ path, module }));
    const validated = validateCaptchaModules(entries);

    expect(getAllCaptchas()).toHaveLength(entries.length);
    expect(new Set(validated.map(({ id }) => id)).size).toBe(entries.length);
    expect(
      getAllCaptchas()
        .map(({ id }) => id)
        .sort(),
    ).toEqual(validated.map(({ id }) => id).sort());
  });

  it('excludes the copyable template from lookup and random selection', () => {
    const ids = getAllCaptchas().map(({ id }) => id);
    expect(ids).not.toContain('your-unique-captcha-id');
    expect(getCaptchaById('your-unique-captcha-id')).toBeUndefined();
    expect(ids).toContain(pickRandomCaptcha()?.id);
  });

  it('finds modules by id and returns undefined for an unknown id', () => {
    for (const captcha of getAllCaptchas()) {
      expect(getCaptchaById(captcha.id)).toBe(captcha);
    }
    expect(getCaptchaById('this-id-does-not-exist')).toBeUndefined();
  });

  it('returns a fresh array so consumers cannot edit the registry list', () => {
    const captchas = getAllCaptchas();
    const count = captchas.length;
    captchas.length = 0;
    expect(getAllCaptchas()).toHaveLength(count);
  });

  it('does not repeat the excluded CAPTCHA when another exists', () => {
    const captchas = getAllCaptchas();
    expect(captchas.length).toBeGreaterThan(1);
    for (const captcha of captchas) {
      expect(pickRandomCaptcha(captcha.id)?.id).not.toBe(captcha.id);
    }
  });
});

describe('login sequence', () => {
  it('runs the traffic light first, then the puzzle piece, then loops', () => {
    expect(
      getAllCaptchas()
        .map(({ id }) => id)
        .slice(0, 2),
    ).toEqual(['runaway-light', 'skittish-piece']);
    expect(pickNextCaptcha()?.id).toBe('runaway-light');
    expect(pickNextCaptcha('runaway-light')?.id).toBe('skittish-piece');
    const last = getAllCaptchas().at(-1)?.id;
    expect(pickNextCaptcha(last)?.id).toBe('runaway-light');
  });

  it('sorts by order, puts unordered modules last, and keeps folder order for ties', () => {
    const sorted = sortByOrder([
      fixture('unordered-a'),
      fixture('third', 1, 3),
      fixture('first', 1, 1),
      fixture('unordered-b'),
      fixture('second', 1, 2),
    ]);
    expect(sorted.map(({ id }) => id)).toEqual([
      'first',
      'second',
      'third',
      'unordered-a',
      'unordered-b',
    ]);
  });

  it('starts at the beginning for an unknown id and handles an empty list', () => {
    const list = [fixture('a'), fixture('b')];
    expect(nextInSequence(list, 'nope')?.id).toBe('a');
    expect(nextInSequence(list, 'b')?.id).toBe('a');
    expect(nextInSequence([], 'a')).toBeUndefined();
  });
});

describe('CAPTCHA contract validation', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, '1'])('rejects invalid order %s', (order) => {
    expect(() =>
      validateCaptchaModules([
        { path: './broken/index.tsx', module: { default: { ...fixture('invalid'), order } } },
      ]),
    ).toThrow('"order" must be a finite number');
  });

  it('accepts omitted weights and valid modules', () => {
    const captcha = fixture('valid');
    expect(
      validateCaptchaModules([{ path: './valid/index.tsx', module: { default: captcha } }]),
    ).toEqual([captcha]);
  });

  it.each(['id', 'title', 'author', 'Component'] as const)(
    'rejects a missing %s with its file path',
    (field) => {
      const captcha: Partial<CaptchaModule> = fixture('invalid');
      delete captcha[field];
      expect(() =>
        validateCaptchaModules([{ path: './broken/index.tsx', module: { default: captcha } }]),
      ).toThrow(new RegExp(`broken/index.tsx.*${field}`));
    },
  );

  it.each(['id', 'title', 'author'] as const)('rejects blank %s', (field) => {
    const captcha = { ...fixture('invalid'), [field]: '   ' };
    expect(() =>
      validateCaptchaModules([{ path: './broken/index.tsx', module: { default: captcha } }]),
    ).toThrow(`"${field}" must be a nonempty string`);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '1'])(
    'rejects invalid weight %s',
    (weight) => {
      expect(() =>
        validateCaptchaModules([
          { path: './broken/index.tsx', module: { default: { ...fixture('invalid'), weight } } },
        ]),
      ).toThrow('"weight" must be a finite number greater than zero');
    },
  );

  it('rejects duplicate ids and identifies both folders', () => {
    expect(() =>
      validateCaptchaModules([
        { path: './first/index.tsx', module: { default: fixture('duplicate') } },
        { path: './second/index.tsx', module: { default: fixture('duplicate') } },
      ]),
    ).toThrow(/second\/index.tsx.*duplicate id "duplicate".*first\/index.tsx/);
  });

  it.each([undefined, null, {}, { default: null }, { default: 'not a module' }])(
    'rejects invalid module exports: %s',
    (module) => {
      expect(() => validateCaptchaModules([{ path: './broken/index.tsx', module }])).toThrow(
        /Invalid CAPTCHA at .\/broken\/index.tsx/,
      );
    },
  );
});

describe('weighted random selection', () => {
  const captchas = [fixture('first', 1), fixture('second', 3), fixture('third', 6)];

  it.each<[number, string]>([
    [0, 'first'],
    [0.099, 'first'],
    [0.1, 'second'],
    [0.399, 'second'],
    [0.4, 'third'],
    [0.999999, 'third'],
  ])('picks %s within the correct weighted interval', (roll, expectedId) => {
    vi.spyOn(Math, 'random').mockReturnValue(roll);
    expect(pickWeightedCaptcha(captchas)?.id).toBe(expectedId);
  });

  it('treats omitted weights as one', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(pickWeightedCaptcha([fixture('first'), fixture('second')])?.id).toBe('second');
  });

  it('removes the previous module before calculating weights', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(pickWeightedCaptcha(captchas, 'first')?.id).toBe('second');
  });

  it('retains the only module even when it was excluded', () => {
    const onlyCaptcha = fixture('only');
    expect(pickWeightedCaptcha([onlyCaptcha], 'only')).toBe(onlyCaptcha);
  });

  it('handles no registered modules gracefully', () => {
    expect(pickWeightedCaptcha([])).toBeUndefined();
  });

  it('ignores unknown exclusions', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(pickWeightedCaptcha(captchas, 'unknown')?.id).toBe('first');
  });

  it('supports finite weights whose sum would otherwise overflow', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    expect(
      pickWeightedCaptcha([fixture('first', Number.MAX_VALUE), fixture('second', Number.MAX_VALUE)])
        ?.id,
    ).toBe('second');
  });
});

import { describe, expect, it } from 'vitest';
import * as Mini from './mini';
import { Ok, ok, type Result } from './utils/result';

// The mini entry mirrors the behavior of the class-based entry,
// but with plain function decoders and standalone operations.
// These tests assert that the decoding logic and error messages match,
// and that the standalone operations behave like their class-method counterparts.

const expectOk = <T>(result: Result<T>, expectedValue: T) => {
  expect(result).toBeInstanceOf(Ok);
  expect(result).toEqual(ok(expectedValue));
};

const expectIssues = <T>(
  result: Result<T>,
  issues: ReadonlyArray<{
    message: string;
    path: ReadonlyArray<string | number>;
  }>
) => {
  expect(result.isOk()).toBe(false);
  if (!result.isOk()) {
    expect(result.issues).toEqual(issues);
  }
};

describe('mini: primitives', () => {
  it('decodes a string', () => {
    expectOk(Mini.decode(Mini.string(), 'hi'), 'hi');
  });

  it('reports the same error message as the main entry', () => {
    expectIssues(Mini.decode(Mini.string(), 5), [
      { message: '5 is not a valid string', path: [] }
    ]);
  });

  it('decodes number, boolean, null and undefined', () => {
    expectOk(Mini.decode(Mini.number(), 99), 99);
    expectOk(Mini.decode(Mini.boolean(), true), true);
    expectOk(Mini.decode(Mini.nullValue(), null), null);
    expectOk(Mini.decode(Mini.undefinedValue(), undefined), undefined);
  });
});

describe('mini: data structures', () => {
  it('decodes a flat object', () => {
    const decoder = Mini.object({
      id: Mini.number(),
      name: Mini.string()
    });
    expectOk(Mini.decode(decoder, { id: 1, name: 'Marty' }), {
      id: 1,
      name: 'Marty'
    });
  });

  it('accumulates nested issues with correct paths', () => {
    const decoder = Mini.object({
      id: Mini.number(),
      roles: Mini.array(Mini.string())
    });
    expectIssues(Mini.decode(decoder, { id: 'x', roles: ['ok', 2] }), [
      { message: '"x" is not a valid number', path: ['id'] },
      { message: '2 is not a valid string', path: ['roles', 1] }
    ]);
  });

  it('supports fromKey mapping', () => {
    const decoder = Mini.object<{ firstName: string }>({
      firstName: { fromKey: 'first_name', decoder: Mini.string() }
    });
    expectOk(Mini.decode(decoder, { first_name: 'Doc' }), {
      firstName: 'Doc'
    });
  });

  it('objectStrict rejects unknown keys', () => {
    const decoder = Mini.objectStrict({ name: Mini.string() });
    expectIssues(Mini.decode(decoder, { name: 'x', extra: 1 }), [
      { message: 'Unknown key "extra" found in strict object', path: [] }
    ]);
  });

  it('decodes a tuple', () => {
    const decoder = Mini.tuple([Mini.number(), Mini.string()]);
    expectOk(Mini.decode(decoder, [1, 'a']), [1, 'a']);
  });

  it('decodes a record', () => {
    const decoder = Mini.record(Mini.number());
    expectOk(Mini.decode(decoder, { a: 1, b: 2 }), { a: 1, b: 2 });
  });
});

describe('mini: combinators', () => {
  it('nullable and optional', () => {
    expectOk(Mini.decode(Mini.nullable(Mini.string()), null), null);
    expectOk(Mini.decode(Mini.optional(Mini.number()), undefined), undefined);
  });

  it('oneOf returns the first success', () => {
    const decoder = Mini.oneOf<string | number>([Mini.string(), Mini.number()]);
    expectOk(Mini.decode(decoder, 42), 42);
  });

  it('discriminatedUnion delegates to the matched variant', () => {
    const decoder = Mini.discriminatedUnion('kind', {
      circle: Mini.object({ kind: Mini.literal('circle'), r: Mini.number() })
    });
    expectIssues(Mini.decode(decoder, { kind: 'circle', r: 'big' }), [
      { message: '"big" is not a valid number', path: ['r'] }
    ]);
  });

  it('allOf returns only the keys that the members declare', () => {
    const decoder = Mini.allOf([
      Mini.object({ o: Mini.object({ a: Mini.number() }) }),
      Mini.object<{ stars: number }>({
        stars: { fromKey: 'stargazers_count', decoder: Mini.number() }
      })
    ]);
    const input = { o: { a: 1, junk: true }, stargazers_count: 7, extra: true };
    expectOk(Mini.decode(decoder, input), { o: { a: 1 }, stars: 7 });
  });

  it('fallback substitutes a default on failure', () => {
    expectOk(Mini.decode(Mini.fallback(0, Mini.number()), 'nope'), 0);
  });

  it('lazy supports recursive decoders', () => {
    type Tree = { value: number; children?: Tree[] };
    const tree: Mini.Decoder<Tree> = Mini.lazy(() =>
      Mini.object<Tree>({
        value: Mini.number(),
        children: Mini.optional(Mini.array(tree))
      })
    );
    expectOk(Mini.decode(tree, { value: 1, children: [{ value: 2 }] }), {
      value: 1,
      children: [{ value: 2 }]
    });
  });
});

describe('mini: operations', () => {
  it('map transforms the decoded value', () => {
    const decoder = Mini.map(Mini.string(), iso => new Date(iso));
    const result = Mini.decode(decoder, '1985-10-26T01:21:00Z');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeInstanceOf(Date);
    }
  });

  it('flatMap chains a dependent decoder', () => {
    const adult = Mini.flatMap(Mini.number(), age =>
      age >= 18 ? Mini.succeed() : Mini.fail(`Age ${age} is less than 18`)
    );
    expectOk(Mini.decode(adult, 18), 18);
    expectIssues(Mini.decode(adult, 17), [
      { message: 'Age 17 is less than 18', path: [] }
    ]);
  });

  it('parse returns the value or throws with a formatted message', () => {
    expect(Mini.parse(Mini.string(), 'hi')).toBe('hi');
    const decoder = Mini.object({ items: Mini.array(Mini.number()) });
    expect(() => Mini.parse(decoder, { items: ['x'] })).toThrow(
      'items[0]: "x" is not a valid number'
    );
  });

  it('parse attaches issues as the error cause', () => {
    try {
      Mini.parse(Mini.number(), 'x');
      throw new Error('should have thrown');
    } catch (error) {
      expect((error as Error).cause).toEqual([
        { message: '"x" is not a valid number', path: [] }
      ]);
    }
  });

  it('decodePromise resolves or rejects', async () => {
    await expect(Mini.decodePromise(Mini.string(), 'ok')).resolves.toBe('ok');
    await expect(Mini.decodePromise(Mini.number(), 'x')).rejects.toThrow(
      '"x" is not a valid number'
    );
  });

  it('toStandardSchema produces a Standard Schema adapter', () => {
    const schema = Mini.toStandardSchema(Mini.object({ id: Mini.number() }));
    expect(schema['~standard'].vendor).toBe('ts.data.json');
    expect(schema['~standard'].validate({ id: 1 })).toEqual({
      value: { id: 1 }
    });
    expect(schema['~standard'].validate({ id: 'x' })).toEqual({
      issues: [{ message: '"x" is not a valid number', path: [{ key: 'id' }] }]
    });
  });
});

describe('mini: FromDecoder inference', () => {
  // The exact-type assertions live in src/mini.type-test.ts, because
  // tsconfig.json excludes spec files from type checking. This case only
  // covers that a decoder built without an explicit type argument decodes.
  it('decodes a value built from the inferred type', () => {
    const decoder = Mini.object({ id: Mini.number(), name: Mini.string() });
    type User = Mini.FromDecoder<typeof decoder>;
    const user: User = { id: 1, name: 'a' };
    expectOk(Mini.decode(decoder, user), user);
  });
});

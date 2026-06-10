import { describe, expect, it } from 'vitest';
import { Decoder } from './core';
import * as JsonDecoder from './schemas';
import { Err, Ok, ok, err, type DecodingIssue, type Result } from './utils/result';

// ---------------------------------------------------------------------------
// Helpers (same pattern as basic-usage.spec.ts / ts-data-json.spec.ts)
// ---------------------------------------------------------------------------

const expectOk = <T>(result: Result<T>, expectedValue: T) => {
  expect(result).toBeInstanceOf(Ok);
  expect(result).toEqual(ok(expectedValue));
};

const expectErrWithIssues = <T>(
  result: Result<T>,
  expectedIssues: ReadonlyArray<{ message: string; path: ReadonlyArray<string | number> }>
) => {
  expect(result).toBeInstanceOf(Err);
  expect((result as Err<T>).issues).toEqual(expectedIssues);
};

interface User {
  id: number;
  name: string;
}

const userDecoder = JsonDecoder.object<User>({
  id: JsonDecoder.number(),
  name: JsonDecoder.string()
});

// ---------------------------------------------------------------------------
// 1. Decoders no longer take a name argument
// ---------------------------------------------------------------------------

describe('v4-migration -- decoders take no name argument', () => {
  it('object decodes without a name argument', () => {
    expectOk(userDecoder.decode({ id: 1, name: 'John' }), { id: 1, name: 'John' });
  });

  it('objectStrict decodes without a name argument', () => {
    const strict = JsonDecoder.objectStrict<User>({
      id: JsonDecoder.number(),
      name: JsonDecoder.string()
    });
    expectOk(strict.decode({ id: 1, name: 'John' }), { id: 1, name: 'John' });
  });

  it('array decodes without a name argument', () => {
    expectOk(JsonDecoder.array(JsonDecoder.string()).decode(['a', 'b']), ['a', 'b']);
  });

  it('oneOf decodes without a name argument', () => {
    const stringOrNumber = JsonDecoder.oneOf<string | number>([
      JsonDecoder.string(),
      JsonDecoder.number()
    ]);
    expectOk(stringOrNumber.decode(42), 42);
  });

  it('record decodes without a name argument', () => {
    expectOk(JsonDecoder.record(JsonDecoder.number()).decode({ a: 1, b: 2 }), { a: 1, b: 2 });
  });
});

// ---------------------------------------------------------------------------
// 2. New structured error model (issues + path), with the exact strings from
//    the migration guide's format table.
// ---------------------------------------------------------------------------

describe('v4-migration -- structured error model', () => {
  it('object field failure carries the key in the path', () => {
    expectErrWithIssues(userDecoder.decode({ id: 'x', name: 'John' }), [
      { message: '"x" is not a valid number', path: ['id'] }
    ]);
  });

  it('array element failure carries the index in the path', () => {
    expectErrWithIssues(JsonDecoder.array(JsonDecoder.string()).decode(['a', 2]), [
      { message: '2 is not a valid string', path: [1] }
    ]);
  });

  it('record value failure carries the key in the path', () => {
    expectErrWithIssues(JsonDecoder.record(JsonDecoder.number()).decode({ a: 'x' }), [
      { message: '"x" is not a valid number', path: ['a'] }
    ]);
  });

  it('strict object reports a simplified unknown-key message', () => {
    const strict = JsonDecoder.objectStrict<User>({
      id: JsonDecoder.number(),
      name: JsonDecoder.string()
    });
    expectErrWithIssues(strict.decode({ id: 1, name: 'John', extra: 'field' }), [
      { message: 'Unknown key "extra" found in strict object', path: [] }
    ]);
  });

  it('primitive failure keeps the same message at the root path', () => {
    expectErrWithIssues(JsonDecoder.string().decode(123), [
      { message: '123 is not a valid string', path: [] }
    ]);
  });

  it('nested failures carry the full path from the root', () => {
    interface Group {
      owner: User;
    }
    const groupDecoder = JsonDecoder.object<Group>({ owner: userDecoder });
    expectErrWithIssues(groupDecoder.decode({ owner: { id: 'x', name: 'John' } }), [
      { message: '"x" is not a valid number', path: ['owner', 'id'] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// oneOf now surfaces the deepest branch's issues (not a generic message)
// ---------------------------------------------------------------------------

describe('v4-migration -- oneOf surfaces the deepest branch', () => {
  it('a simple mismatch surfaces the first branch failure', () => {
    const stringOrNumber = JsonDecoder.oneOf<string | number>([
      JsonDecoder.string(),
      JsonDecoder.number()
    ]);
    expectErrWithIssues(stringOrNumber.decode(true), [
      { message: 'true is not a valid string', path: [] }
    ]);
  });

  it('the branch that decoded furthest wins', () => {
    type Shape = { kind: 'circle'; radius: number } | null;
    const shapeDecoder = JsonDecoder.oneOf<Shape>([
      JsonDecoder.object({
        kind: JsonDecoder.literal('circle' as const),
        radius: JsonDecoder.number()
      }) as Decoder<Shape>,
      JsonDecoder.null()
    ]);
    expectErrWithIssues(shapeDecoder.decode({ kind: 'circle', radius: 'big' }), [
      { message: '"big" is not a valid number', path: ['radius'] }
    ]);
  });

  it('an empty decoder list falls back to the generic message', () => {
    expectErrWithIssues(JsonDecoder.oneOf<never>([]).decode(true), [
      { message: 'true could not be decoded with any of the provided decoders', path: [] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// 3. parse() / decodePromise() now throw / reject Error objects
// ---------------------------------------------------------------------------

describe('v4-migration -- parse and decodePromise throw Error objects', () => {
  it('parse throws an Error whose message is the formatted issues', () => {
    expect(() => userDecoder.parse({ id: 'x', name: 'John' })).toThrow(
      'id: "x" is not a valid number'
    );
  });

  it('parse attaches the structured issues as the Error cause', () => {
    try {
      userDecoder.parse({ id: 'x', name: 'John' });
      expect.unreachable('parse should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).cause).toEqual([
        { message: '"x" is not a valid number', path: ['id'] }
      ] satisfies DecodingIssue[]);
    }
  });

  it('decodePromise rejects with an Error whose message is the formatted issues', async () => {
    await expect(userDecoder.decodePromise({ id: 'x', name: 'John' })).rejects.toThrow(
      'id: "x" is not a valid number'
    );
  });
});

// ---------------------------------------------------------------------------
// 4. The err() factory takes issues (relevant to custom decoders)
// ---------------------------------------------------------------------------

describe('v4-migration -- err() factory takes issues', () => {
  const myStringDecoder = new Decoder<string>(json =>
    typeof json === 'string' ? ok(json) : err([{ message: 'Expected a string', path: [] }])
  );

  it('a custom decoder built with err() returns the expected issue', () => {
    expectOk(myStringDecoder.decode('hello'), 'hello');
    expectErrWithIssues(myStringDecoder.decode(123), [
      { message: 'Expected a string', path: [] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// New capability: all errors reported at once
// ---------------------------------------------------------------------------

describe('v4-migration -- all errors at once', () => {
  it('object decoder accumulates every failing field', () => {
    expectErrWithIssues(userDecoder.decode({ id: 'not-a-number', name: 42 }), [
      { message: '"not-a-number" is not a valid number', path: ['id'] },
      { message: '42 is not a valid string', path: ['name'] }
    ]);
  });

  it('array decoder accumulates every failing element', () => {
    expectErrWithIssues(JsonDecoder.array(JsonDecoder.number()).decode([1, '2', '3']), [
      { message: '"2" is not a valid number', path: [1] },
      { message: '"3" is not a valid number', path: [2] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// New capability: structured issues mapped to a record of field errors
// ---------------------------------------------------------------------------

describe('v4-migration -- structured issues with paths', () => {
  it('issues can be reduced to a field -> message map', () => {
    const result = userDecoder.decode({ id: 'bad', name: 42 });
    expect(result.isOk()).toBe(false);
    if (!result.isOk()) {
      const fieldErrors = result.issues.reduce<Record<string, string>>((acc, issue) => {
        acc[issue.path.join('.')] = issue.message;
        return acc;
      }, {});
      expect(fieldErrors).toEqual({
        id: '"bad" is not a valid number',
        name: '42 is not a valid string'
      });
    }
  });
});

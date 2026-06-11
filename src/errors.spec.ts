import { describe, expect, it } from 'vitest';
import { Decoder, formatIssuePath } from './core';
import * as jd from './schemas';
import { Err, Ok, Result } from './utils/result';

const expectErrWithIssues = <a>(
  result: Result<a>,
  expectedIssues: ReadonlyArray<{
    message: string;
    path: ReadonlyArray<string | number>;
  }>
) => {
  expect(result).toBeInstanceOf(Err);
  expect((result as Err<a>).issues).toEqual(expectedIssues);
};
const expectOk = <a>(result: Result<a>) => expect(result).toBeInstanceOf(Ok);

// ---------------------------------------------------------------------------
// Section 1 - one simple failure test per decoder
// ---------------------------------------------------------------------------
describe('error handling', () => {
  describe('string', () => {
    it('fails when not a string', () => {
      expectErrWithIssues(jd.string().decode(123), [
        { message: '123 is not a valid string', path: [] }
      ]);
    });
  });

  describe('number', () => {
    it('fails when not a number', () => {
      expectErrWithIssues(jd.number().decode('x'), [
        { message: '"x" is not a valid number', path: [] }
      ]);
    });
  });

  describe('boolean', () => {
    it('fails when not a boolean', () => {
      expectErrWithIssues(jd.boolean().decode(1), [
        { message: '1 is not a valid boolean', path: [] }
      ]);
    });
  });

  describe('null', () => {
    it('fails when not null', () => {
      expectErrWithIssues(jd.null().decode(1), [
        { message: '1 is not null', path: [] }
      ]);
    });
  });

  describe('undefined', () => {
    it('fails when not undefined', () => {
      expectErrWithIssues(jd.undefined().decode(1), [
        { message: '1 is not undefined', path: [] }
      ]);
    });
  });

  describe('object', () => {
    it('fails with the field path when a field is invalid', () => {
      const decoder = jd.object({ a: jd.string() });
      expectErrWithIssues(decoder.decode({ a: 1 }), [
        { message: '1 is not a valid string', path: ['a'] }
      ]);
    });
  });

  describe('objectStrict', () => {
    it('fails when an unknown key is present', () => {
      const decoder = jd.objectStrict<{ a: string }>({
        a: jd.string()
      });
      expectErrWithIssues(decoder.decode({ a: 'x', extra: 1 }), [
        { message: 'Unknown key "extra" found in strict object', path: [] }
      ]);
    });
  });

  describe('emptyObject', () => {
    it('fails when the object is not empty', () => {
      expectErrWithIssues(jd.emptyObject().decode({ a: 1 }), [
        { message: '{"a":1} is not a valid empty object', path: [] }
      ]);
    });
  });

  describe('array', () => {
    it('fails with the element index path', () => {
      const decoder = jd.array(jd.number());
      expectErrWithIssues(decoder.decode(['x']), [
        { message: '"x" is not a valid number', path: [0] }
      ]);
    });
  });

  describe('tuple', () => {
    it('fails when the length does not match', () => {
      const decoder = jd.tuple([jd.number(), jd.number()]);
      expectErrWithIssues(decoder.decode([1, 2, 3]), [
        { message: 'tuple received 3 items but expected 2', path: [] }
      ]);
    });
  });

  describe('record', () => {
    it('fails with the value key path', () => {
      const decoder = jd.record(jd.number());
      expectErrWithIssues(decoder.decode({ a: 'x' }), [
        { message: '"x" is not a valid number', path: ['a'] }
      ]);
    });
  });

  describe('enumeration', () => {
    it('fails when the value is not a member', () => {
      enum Color {
        Red = 'red'
      }
      expectErrWithIssues(jd.enumeration<Color>(Color).decode('green'), [
        { message: '"green" is not a valid enum value', path: [] }
      ]);
    });

    it('renders the rejected value with JSON.stringify, like the other primitives', () => {
      enum Color {
        Red = 'red'
      }
      // A string value keeps its quotes...
      expectErrWithIssues(jd.enumeration<Color>(Color).decode('green'), [
        { message: '"green" is not a valid enum value', path: [] }
      ]);
      // ...while `null` renders WITHOUT quotes, exactly like string().decode(null).
      expectErrWithIssues(jd.enumeration<Color>(Color).decode(null), [
        { message: 'null is not a valid enum value', path: [] }
      ]);
      expectErrWithIssues(jd.string().decode(null), [
        { message: 'null is not a valid string', path: [] }
      ]);
    });
  });

  describe('oneOf', () => {
    it('fails with a none-matched summary plus the rejected alternatives collapsed', () => {
      const decoder = jd.oneOf<string | number>([jd.string(), jd.number()]);
      expectErrWithIssues(decoder.decode(true), [
        { message: 'no alternative matched (tried 2)', path: [] },
        {
          message: 'true is not a valid string or true is not a valid number',
          path: []
        }
      ]);
    });
  });

  describe('allOf', () => {
    it('accumulates issues from every failing sub-decoder', () => {
      const decoder = jd.allOf([
        jd.object({ firstname: jd.string() }),
        jd.object({ lastname: jd.string() })
      ]);
      expectErrWithIssues(decoder.decode({ firstname: 'a' }), [
        { message: 'undefined is not a valid string', path: ['lastname'] }
      ]);
    });
  });

  describe('literal', () => {
    it('fails when the value is not exact', () => {
      expectErrWithIssues(jd.literal(1).decode(2), [
        { message: '2 is not exactly 1', path: [] }
      ]);
    });
  });

  describe('fail', () => {
    it('always fails with the provided message', () => {
      expectErrWithIssues(jd.fail<string>('boom').decode('anything'), [
        { message: 'boom', path: [] }
      ]);
    });
  });

  describe('nullable', () => {
    it('delegates the failure to the inner decoder', () => {
      expectErrWithIssues(jd.nullable(jd.number()).decode('x'), [
        { message: '"x" is not a valid number', path: [] }
      ]);
    });
  });

  describe('optional', () => {
    it('delegates the failure to the inner decoder', () => {
      expectErrWithIssues(jd.optional(jd.number()).decode('x'), [
        { message: '"x" is not a valid number', path: [] }
      ]);
    });
  });

  describe('lazy', () => {
    it('delegates the failure to the produced decoder', () => {
      const decoder = jd.lazy(() => jd.number());
      expectErrWithIssues(decoder.decode('x'), [
        { message: '"x" is not a valid number', path: [] }
      ]);
    });
  });
});

// ---------------------------------------------------------------------------
// Section 2 - decoders that never fail (document the behavior)
// ---------------------------------------------------------------------------
describe('decoders that never fail', () => {
  it('succeed() returns Ok on any input', () => {
    expectOk(jd.succeed().decode(Symbol('nope')));
  });

  it('constant() returns Ok even on mismatching input', () => {
    expectOk(jd.constant(true).decode('hello'));
  });

  it('fallback() swallows the failure and returns the default', () => {
    const result = jd.fallback(0, jd.number()).decode('not a number');
    expect(result).toBeInstanceOf(Ok);
    expect((result as Ok<number>).value).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Section 2b - path formatting (parse() / decodePromise() message location)
//
// The structured `path` array is rendered into the thrown Error message with
// object keys dot-joined and array indices in bracket notation.
// ---------------------------------------------------------------------------
describe('issue path formatting', () => {
  it('formatIssuePath joins object keys with dots and array indices with brackets', () => {
    expect(formatIssuePath([])).toBe('');
    expect(formatIssuePath(['user', 'name'])).toBe('user.name');
    expect(formatIssuePath(['items', 0])).toBe('items[0]');
    expect(formatIssuePath(['user', 'roles', 1])).toBe('user.roles[1]');
    // A leading array index has no object key in front of it.
    expect(formatIssuePath([0, 'email'])).toBe('[0].email');
  });

  it('parse() formats array-index paths with bracket notation (items[0])', () => {
    const decoder = jd.object({
      items: jd.array(jd.number())
    });
    let thrown: unknown;
    try {
      decoder.parse({ items: ['x'] });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Error);
    const error = thrown as Error;
    expect(error.message).toBe('items[0]: "x" is not a valid number');
    // The structured issues remain available on `cause`, unchanged.
    expect(error.cause).toEqual([
      { message: '"x" is not a valid number', path: ['items', 0] }
    ]);
  });

  it('parse() composes object and array segments (users[0].email)', () => {
    const decoder = jd.object({
      users: jd.array(jd.object({ email: jd.string() }))
    });
    let thrown: unknown;
    try {
      decoder.parse({ users: [{ email: 42 }] });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Error);
    const error = thrown as Error;
    expect(error.message).toBe('users[0].email: 42 is not a valid string');
    expect(error.cause).toEqual([
      { message: '42 is not a valid string', path: ['users', 0, 'email'] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// Section 3 - observations / exploration (surface the quirks)
//
// These tests pin down the CURRENT behavior of aspects that may be worth
// reconsidering. They are intentionally written against today's output: if any
// quirk is "fixed", the matching test fails, which is the signal to revisit it.
// ---------------------------------------------------------------------------
describe('error mechanism observations', () => {
  it('primitiveError quoting is value-type dependent (JSON.stringify)', () => {
    // A string value is rendered WITH quotes...
    expectErrWithIssues(jd.number().decode('5'), [
      { message: '"5" is not a valid number', path: [] }
    ]);
    // ...while a number value is rendered WITHOUT quotes.
    expectErrWithIssues(jd.string().decode(5), [
      { message: '5 is not a valid string', path: [] }
    ]);
  });

  it('oneOf makes "none matched" explicit while keeping the closest failure actionable', () => {
    // Flat union: the summary tells you all alternatives were tried, and the
    // competing branches (tied at the same depth) are collapsed into one issue
    // so they read as alternatives ("X or Y"), not separate requirements.
    const shallow = jd.oneOf<string | number>([jd.string(), jd.number()]);
    expectErrWithIssues(shallow.decode(true), [
      { message: 'no alternative matched (tried 2)', path: [] },
      {
        message: 'true is not a valid string or true is not a valid number',
        path: []
      }
    ]);

    // Nested in an object, oneOf reports every alternative's failure (the object
    // branch's `radius` and the `null` branch's mismatch), all carrying the
    // parent path 'shape'. For an `X | null` field, prefer nullable(X) (below).
    type Shape = { kind: 'circle'; radius: number } | null;
    const shapeDecoder = jd.object({
      shape: jd.oneOf<Shape>([
        jd.object({
          kind: jd.literal('circle' as const),
          radius: jd.number()
        }) as unknown as Decoder<Shape>,
        jd.null()
      ])
    });
    expectErrWithIssues(
      shapeDecoder.decode({ shape: { kind: 'circle', radius: 'big' } }),
      [
        { message: 'no alternative matched (tried 2)', path: ['shape'] },
        { message: '"big" is not a valid number', path: ['shape', 'radius'] },
        {
          message: '{"kind":"circle","radius":"big"} is not null',
          path: ['shape']
        }
      ]
    );
  });
});

// ---------------------------------------------------------------------------
// oneOf - complex combinations and nesting
//
// These exercise oneOf across realistic shapes so the produced issues can be
// inspected. They assert the EXACT current output (order included).
// ---------------------------------------------------------------------------
describe('oneOf - complex combinations and nesting', () => {
  type Circle = { kind: 'circle'; radius: number };
  type Square = { kind: 'square'; side: number };
  type Shape = Circle | Square;

  const circle = jd.object<Circle>({
    kind: jd.literal('circle'),
    radius: jd.number()
  });
  const square = jd.object<Square>({
    kind: jd.literal('square'),
    side: jd.number()
  });

  it('1. flat primitive union collapses the alternatives into one issue', () => {
    const decoder = jd.oneOf<string | number>([jd.string(), jd.number()]);
    expectErrWithIssues(decoder.decode(true), [
      { message: 'no alternative matched (tried 2)', path: [] },
      {
        message: 'true is not a valid string or true is not a valid number',
        path: []
      }
    ]);
  });

  it('2. union of two object branches does NOT isolate the intended branch', () => {
    // Both branches fail at depth 1 (circle at radius; square at kind + side),
    // so they tie and collapse together: the circle radius error is mixed with
    // the square kind/side errors. This is the limitation discriminatedUnion
    // is meant to solve.
    const decoder = jd.oneOf<Shape>([circle, square]);
    expectErrWithIssues(decoder.decode({ kind: 'circle', radius: 'big' }), [
      { message: 'no alternative matched (tried 2)', path: [] },
      { message: '"big" is not a valid number', path: ['radius'] },
      { message: '"circle" is not exactly "square"', path: ['kind'] },
      { message: 'undefined is not a valid number', path: ['side'] }
    ]);
  });

  it('3. reports every alternative (object | null); use nullable for a clean error', () => {
    const decoder = jd.oneOf<Shape | null>([
      circle as unknown as Decoder<Shape | null>,
      jd.null()
    ]);
    expectErrWithIssues(decoder.decode({ kind: 'circle', radius: 'big' }), [
      { message: 'no alternative matched (tried 2)', path: [] },
      { message: '"big" is not a valid number', path: ['radius'] },
      {
        message: '{"kind":"circle","radius":"big"} is not null',
        path: []
      }
    ]);

    // nullable(X) delegates to X, so its error is just X's failure.
    const nullableCircle = jd.nullable(circle);
    expectErrWithIssues(
      nullableCircle.decode({ kind: 'circle', radius: 'big' }),
      [{ message: '"big" is not a valid number', path: ['radius'] }]
    );
  });

  it('4. nested in an array inside an object, the parent path is prepended', () => {
    const decoder = jd.object({
      items: jd.array(jd.oneOf<string | number>([jd.string(), jd.number()]))
    });
    expectErrWithIssues(decoder.decode({ items: [true] }), [
      { message: 'no alternative matched (tried 2)', path: ['items', 0] },
      {
        message: 'true is not a valid string or true is not a valid number',
        path: ['items', 0]
      }
    ]);
  });

  it('5. oneOf of oneOf leaks the inner summary into the collapsed message', () => {
    // ROUGH EDGE: nesting unions folds the inner "no alternative matched"
    // summary into the outer collapse, producing a noisy message.
    const decoder = jd.oneOf<string | number | boolean>([
      jd.oneOf<string | number>([jd.string(), jd.number()]),
      jd.boolean()
    ]);
    expectErrWithIssues(decoder.decode(null), [
      { message: 'no alternative matched (tried 2)', path: [] },
      {
        message:
          'no alternative matched (tried 2) or null is not a valid string or null is not a valid number or null is not a valid boolean',
        path: []
      }
    ]);
  });

  it('6. the first matching branch wins (sanity anchor)', () => {
    const decoder = jd.oneOf<string | number>([jd.string(), jd.number()]);
    const result = decoder.decode(42);
    expect(result).toBeInstanceOf(Ok);
    expect((result as Ok<string | number>).value).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// allOf - complex combinations and nesting
// ---------------------------------------------------------------------------
describe('allOf - complex combinations and nesting', () => {
  it('1. accumulates issues from every failing object decoder', () => {
    const decoder = jd.allOf([
      jd.object({ firstname: jd.string() }),
      jd.object({ lastname: jd.string() })
    ]);
    expectErrWithIssues(decoder.decode({ firstname: 1, lastname: 2 }), [
      { message: '1 is not a valid string', path: ['firstname'] },
      { message: '2 is not a valid string', path: ['lastname'] }
    ]);
  });

  it('2. a failing oneOf sub-decoder contributes its summary + collapsed alternatives', () => {
    const decoder = jd.allOf([
      jd.object({ firstname: jd.string() }),
      jd.object({
        role: jd.oneOf([jd.literal('admin'), jd.literal('user')])
      })
    ]);
    expectErrWithIssues(decoder.decode({ firstname: 'John', role: 'guest' }), [
      { message: 'no alternative matched (tried 2)', path: ['role'] },
      {
        message:
          '"guest" is not exactly "admin" or "guest" is not exactly "user"',
        path: ['role']
      }
    ]);
  });

  it('3. nested inside an object, the parent path is prepended to every issue', () => {
    const decoder = jd.object({
      user: jd.allOf([
        jd.object({ firstname: jd.string() }),
        jd.object({ lastname: jd.string() })
      ])
    });
    expectErrWithIssues(
      decoder.decode({ user: { firstname: 1, lastname: 2 } }),
      [
        { message: '1 is not a valid string', path: ['user', 'firstname'] },
        { message: '2 is not a valid string', path: ['user', 'lastname'] }
      ]
    );
  });

  it('4. does not short-circuit: a passing middle decoder adds nothing, failures keep their order', () => {
    const decoder = jd.allOf([
      jd.object({ a: jd.string() }),
      jd.object({ b: jd.number() }),
      jd.object({ c: jd.boolean() })
    ]);
    expectErrWithIssues(decoder.decode({ a: 1, b: 2, c: 3 }), [
      { message: '1 is not a valid string', path: ['a'] },
      { message: '3 is not a valid boolean', path: ['c'] }
    ]);
  });

  it('5. deep-merges successful branches, and reports the merged-shape failure', () => {
    const decoder = jd.allOf([
      jd.object({ a: jd.object({ x: jd.number() }) }),
      jd.object({ a: jd.object({ y: jd.number() }) })
    ]);
    // Ok: both branches succeed and their results deep-merge.
    const ok = decoder.decode({ a: { x: 1, y: 2 } });
    expect(ok).toBeInstanceOf(Ok);
    expect((ok as Ok<unknown>).value).toEqual({ a: { x: 1, y: 2 } });
    // Err: the second branch fails on the merged value.
    expectErrWithIssues(decoder.decode({ a: { x: 1 } }), [
      { message: 'undefined is not a valid number', path: ['a', 'y'] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// discriminatedUnion - precise tagged-union errors (no heuristic)
//
// Contrast with the oneOf scenarios above: knowing the tag key, this isolates
// the intended variant and reports only its failure.
// ---------------------------------------------------------------------------
describe('discriminatedUnion - complex combinations and nesting', () => {
  type Circle = { kind: 'circle'; radius: number };
  type Square = { kind: 'square'; side: number };

  const shape = jd.discriminatedUnion('kind', {
    circle: jd.object<Circle>({
      kind: jd.literal('circle'),
      radius: jd.number()
    }),
    square: jd.object<Square>({
      kind: jd.literal('square'),
      side: jd.number()
    })
  });

  it('1. isolates the matched variant and reports only its failure', () => {
    // Unlike oneOf, no square kind/side noise: only the circle radius error.
    expectErrWithIssues(shape.decode({ kind: 'circle', radius: 'big' }), [
      { message: '"big" is not a valid number', path: ['radius'] }
    ]);
  });

  it('2. reports the expected tags when the discriminant is unknown', () => {
    expectErrWithIssues(shape.decode({ kind: 'triangle' }), [
      {
        message: '"kind" must be one of "circle", "square", but got "triangle"',
        path: ['kind']
      }
    ]);
  });

  it('3. reports the expected tags when the discriminant is missing', () => {
    expectErrWithIssues(shape.decode({ radius: 5 }), [
      {
        message: '"kind" must be one of "circle", "square", but got undefined',
        path: ['kind']
      }
    ]);
  });

  it('4. fails with an object error on non-object input', () => {
    expectErrWithIssues(shape.decode('nope'), [
      { message: '"nope" is not a valid object', path: [] }
    ]);
  });

  it('5. nested in an object, the parent path is prepended to the failure', () => {
    const decoder = jd.object({ shape });
    expectErrWithIssues(
      decoder.decode({ shape: { kind: 'square', side: 'wide' } }),
      [{ message: '"wide" is not a valid number', path: ['shape', 'side'] }]
    );
    expectErrWithIssues(decoder.decode({ shape: { kind: 'hexagon' } }), [
      {
        message: '"kind" must be one of "circle", "square", but got "hexagon"',
        path: ['shape', 'kind']
      }
    ]);
  });

  it('6. decodes the matching variant successfully', () => {
    const result = shape.decode({ kind: 'square', side: 4 });
    expect(result).toBeInstanceOf(Ok);
    expect((result as Ok<Circle | Square>).value).toEqual({
      kind: 'square',
      side: 4
    });
  });
});

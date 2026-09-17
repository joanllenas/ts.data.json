import { describe, expect, it } from 'vitest';
import * as J from './index';
import * as M from './mini';

// The two entry points share one set of decoding factories in src/internal.
// Their public types are declared separately, so this suite is what proves the
// runtime behavior has not drifted: for every schema, both entries must return
// deeply equal Results for the same input.
//
// Add a case here whenever a schema is added to either entry.

enum Suit {
  Hearts = 'hearts',
  Spades = 'spades'
}

type Case = {
  name: string;
  main: () => J.Decoder<any>;
  mini: () => M.Decoder<any>;
  inputs: unknown[];
};

const cases: Case[] = [
  {
    name: 'string',
    main: () => J.string(),
    mini: () => M.string(),
    inputs: ['hi', '', 5, null, undefined, {}]
  },
  {
    name: 'number',
    main: () => J.number(),
    mini: () => M.number(),
    inputs: [0, -1.5, '2', null, undefined, NaN]
  },
  {
    name: 'boolean',
    main: () => J.boolean(),
    mini: () => M.boolean(),
    inputs: [true, false, 'true', 0, null]
  },
  {
    name: 'null',
    main: () => J.null(),
    mini: () => M.null(),
    inputs: [null, undefined, 0, 'null']
  },
  {
    name: 'undefined',
    main: () => J.undefined(),
    mini: () => M.undefined(),
    inputs: [undefined, null, 0, '']
  },
  {
    name: 'constant',
    main: () => J.constant(42),
    mini: () => M.constant(42),
    inputs: ['ignored', null, undefined]
  },
  {
    name: 'succeed',
    main: () => J.succeed(),
    mini: () => M.succeed(),
    inputs: ['anything', null, undefined, { a: 1 }]
  },
  {
    name: 'fail',
    main: () => J.fail<string>('always broken'),
    mini: () => M.fail<string>('always broken'),
    inputs: ['x', null]
  },
  {
    name: 'literal',
    main: () => J.literal('circle'),
    mini: () => M.literal('circle'),
    inputs: ['circle', 'square', null, 0]
  },
  {
    name: 'enumeration',
    main: () => J.enumeration<Suit>(Suit),
    mini: () => M.enumeration<Suit>(Suit),
    inputs: ['hearts', 'spades', 'clubs', null]
  },
  {
    name: 'emptyObject',
    main: () => J.emptyObject(),
    mini: () => M.emptyObject(),
    inputs: [{}, { a: 1 }, null, []]
  },
  {
    name: 'array of number',
    main: () => J.array(J.number()),
    mini: () => M.array(M.number()),
    inputs: [[], [1, 2], [1, 'x'], ['a', 'b'], 'not an array', null]
  },
  {
    name: 'record of number',
    main: () => J.record(J.number()),
    mini: () => M.record(M.number()),
    inputs: [{}, { a: 1 }, { a: '1', b: '2' }, null, 5]
  },
  {
    name: 'tuple',
    main: () => J.tuple([J.number(), J.string()]),
    mini: () => M.tuple([M.number(), M.string()]),
    inputs: [[1, 'a'], [1], [1, 'a', 'extra'], ['a', 1], null]
  },
  {
    name: 'object',
    main: () => J.object({ id: J.number(), name: J.string() }),
    mini: () => M.object({ id: M.number(), name: M.string() }),
    inputs: [
      { id: 1, name: 'a' },
      { id: 'x', name: 2 },
      { id: 1 },
      {},
      null,
      'nope'
    ]
  },
  {
    name: 'object with fromKey',
    main: () =>
      J.object<{ firstName: string; age: number }>({
        firstName: { fromKey: 'first_name', decoder: J.string() },
        age: J.number()
      }),
    mini: () =>
      M.object<{ firstName: string; age: number }>({
        firstName: { fromKey: 'first_name', decoder: M.string() },
        age: M.number()
      }),
    inputs: [
      { first_name: 'Doc', age: 60 },
      { firstName: 'Doc', age: 60 },
      { first_name: 2, age: 'x' },
      {}
    ]
  },
  {
    name: 'objectStrict',
    main: () => J.objectStrict({ name: J.string() }),
    mini: () => M.objectStrict({ name: M.string() }),
    inputs: [
      { name: 'a' },
      { name: 'a', extra: 1 },
      { name: 1, extra: 1 },
      {},
      null
    ]
  },
  {
    name: 'objectStrict with fromKey',
    main: () =>
      J.objectStrict<{ userName: string }>({
        userName: { fromKey: 'user_name', decoder: J.string() }
      }),
    mini: () =>
      M.objectStrict<{ userName: string }>({
        userName: { fromKey: 'user_name', decoder: M.string() }
      }),
    inputs: [{ user_name: 'a' }, { userName: 'a' }, { user_name: 'a', x: 1 }]
  },
  {
    name: 'optional',
    main: () => J.optional(J.number()),
    mini: () => M.optional(M.number()),
    inputs: [undefined, 1, 'x', null]
  },
  {
    name: 'nullable',
    main: () => J.nullable(J.number()),
    mini: () => M.nullable(M.number()),
    inputs: [null, 1, 'x', undefined]
  },
  {
    name: 'fallback',
    main: () => J.fallback(0, J.number()),
    mini: () => M.fallback(0, M.number()),
    inputs: [5, 'nope', null, undefined]
  },
  {
    name: 'oneOf',
    main: () => J.oneOf([J.string(), J.number()]),
    mini: () => M.oneOf([M.string(), M.number()]),
    inputs: ['a', 1, true, null, {}]
  },
  {
    name: 'oneOf of objects',
    main: () =>
      J.oneOf([
        J.object({ kind: J.literal('circle'), radius: J.number() }),
        J.null()
      ]),
    mini: () =>
      M.oneOf([
        M.object({ kind: M.literal('circle'), radius: M.number() }),
        M.null()
      ]),
    inputs: [
      { kind: 'circle', radius: 1 },
      null,
      { kind: 'circle', radius: 'big' },
      { kind: 'square' }
    ]
  },
  {
    name: 'allOf',
    main: () =>
      J.allOf([J.object({ a: J.number() }), J.object({ b: J.string() })]),
    mini: () =>
      M.allOf([M.object({ a: M.number() }), M.object({ b: M.string() })]),
    inputs: [
      { a: 1, b: 'x' },
      { a: 1, b: 'x', extra: true },
      { a: 1 },
      {},
      null
    ]
  },
  {
    name: 'discriminatedUnion',
    main: () =>
      J.discriminatedUnion('kind', {
        circle: J.object({ kind: J.literal('circle'), r: J.number() }),
        square: J.object({ kind: J.literal('square'), s: J.string() })
      }),
    mini: () =>
      M.discriminatedUnion('kind', {
        circle: M.object({ kind: M.literal('circle'), r: M.number() }),
        square: M.object({ kind: M.literal('square'), s: M.string() })
      }),
    inputs: [
      { kind: 'circle', r: 1 },
      { kind: 'square', s: 'x' },
      { kind: 'circle', r: 'big' },
      { kind: 'triangle' },
      {},
      null
    ]
  },
  {
    name: 'nested object in array',
    main: () => J.array(J.object({ id: J.number() })),
    mini: () => M.array(M.object({ id: M.number() })),
    inputs: [[{ id: 1 }], [{ id: 'x' }, { id: 'y' }], [null], []]
  }
];

describe('entry point parity', () => {
  cases.forEach(({ name, main, mini, inputs }) => {
    it(`${name} decodes identically in both entry points`, () => {
      const mainDecoder = main();
      const miniDecoder = mini();
      inputs.forEach(input => {
        const fromMain = mainDecoder.decode(input);
        const fromMini = M.decode(miniDecoder, input);
        expect(fromMini.isOk()).toBe(fromMain.isOk());
        expect(fromMini).toEqual(fromMain);
      });
    });
  });

  it('covers every schema the mini entry exports', () => {
    // Derived from the real exports, not a hand-written list, so adding a
    // schema to mini.ts without adding a case here fails this test.
    const notSchemas = new Set([
      'decode',
      'parse',
      'decodePromise',
      'map',
      'flatMap',
      'toStandardSchema',
      'ok',
      'err',
      'Ok',
      'Err',
      'formatIssuePath',
      // Takes a thunk rather than a value, so it has its own case in mini.spec.ts.
      'lazy'
    ]);
    const covered = new Set(cases.flatMap(({ name }) => name.split(' ')));
    const schemas = Object.keys(M).filter(
      name =>
        typeof (M as Record<string, unknown>)[name] === 'function' &&
        !notSchemas.has(name)
    );
    expect(schemas.length).toBeGreaterThan(0);
    expect(schemas.filter(name => !covered.has(name))).toEqual([]);
  });
});

describe('parity of the throwing and promise entry points', () => {
  const decoders = {
    main: J.object({ items: J.array(J.number()) }),
    mini: M.object({ items: M.array(M.number()) })
  };
  const bad = { items: ['x'] };

  it('parse throws the same message and cause', () => {
    let mainError: Error | undefined;
    let miniError: Error | undefined;
    try {
      decoders.main.parse(bad);
    } catch (error) {
      mainError = error as Error;
    }
    try {
      M.parse(decoders.mini, bad);
    } catch (error) {
      miniError = error as Error;
    }
    expect(miniError?.message).toBe(mainError?.message);
    expect(miniError?.cause).toEqual(mainError?.cause);
  });

  it('decodePromise rejects with the same message', async () => {
    const mainRejection = await decoders.main
      .decodePromise(bad)
      .catch((error: Error) => error.message);
    const miniRejection = await M.decodePromise(decoders.mini, bad).catch(
      (error: Error) => error.message
    );
    expect(miniRejection).toBe(mainRejection);
  });

  it('the Standard Schema adapters agree', () => {
    expect(
      M.toStandardSchema(decoders.mini)['~standard'].validate(bad)
    ).toEqual(decoders.main['~standard'].validate(bad));
  });
});

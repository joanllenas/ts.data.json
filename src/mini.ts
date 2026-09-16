/**
 * Function-based entry point for ts.data.json.
 *
 * @example
 * ```ts
 * import * as J from 'ts.data.json/mini';
 *
 * const user = J.object({ id: J.number(), name: J.string() });
 *
 * J.decode(user, json);            // Result<{ id: number; name: string }>
 * J.parse(user, json);             // throws on failure
 * const trimmed = J.map(J.string(), s => s.trim());
 * ```
 *
 * @module mini
 */

import { ok, err, type Result, type DecodingIssue } from './utils/result';
import { formatIssues, type DecodeFn } from './internal/runtime';
import type {
  OutputOf,
  OutputsOf,
  UnionToIntersectionOf,
  IntersectionOfOutputs
} from './internal/types';
import type { StandardSchemaV1 } from './utils/standard-schema-v1';
import {
  stringFn,
  numberFn,
  booleanFn,
  nullFn,
  undefinedFn,
  constantFn,
  succeedFn,
  failFn,
  literalFn,
  enumerationFn,
  emptyObjectFn,
  arrayFn,
  tupleFn,
  objectFn,
  objectStrictFn,
  recordFn,
  optionalFn,
  nullableFn,
  fallbackFn,
  lazyFn,
  oneOfFn,
  allOfFn,
  discriminatedUnionFn,
  normalizeFields,
  type FieldSpec,
  type EmptyObject
} from './internal/schemas';

export {
  Ok,
  Err,
  ok,
  err,
  type Result,
  type DecodingIssue
} from './utils/result';
export { formatIssuePath } from './internal/runtime';
export type { EmptyObject } from './internal/schemas';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/**
 * A decoder: a function that validates an unknown JSON value and returns a {@link Result}.
 * Build decoders with the schema functions below, run them with {@link decode}, {@link parse}, or {@link decodePromise},
 * and combine them with {@link map} and {@link flatMap}
 */
export type Decoder<T> = (json: any) => Result<T>;

/**
 * Extracts the decoded type `T` from a {@link Decoder}.
 *
 * @example
 * ```ts
 * const user = object({ id: number(), name: string() });
 * type User = FromDecoder<typeof user>; // { id: number; name: string }
 * ```
 */
export type FromDecoder<D> = OutputOf<D>;

/** Infers the decoded type of a decoder. */
export type DecoderOutput<D> = OutputOf<D>;

/** Converts a union to an intersection. */
export type UnionToIntersection<U> = UnionToIntersectionOf<U>;

// ---------------------------------------------------------------------------
// Schema builders
//
// These re-expose the shared factories with decoder-precise public types. The
// typed-const form (`export const x: Sig = xFn`) adds no runtime wrapper,
// because the factories already take and return plain decode functions.
// ---------------------------------------------------------------------------

/** Decoder for `string` values. */
export const string: () => Decoder<string> = stringFn;

/** Decoder for `number` values. */
export const number: () => Decoder<number> = numberFn;

/** Decoder for `boolean` values. */
export const boolean: () => Decoder<boolean> = booleanFn;

const nullDecoder: () => Decoder<null> = nullFn;
const undefinedDecoder: () => Decoder<undefined> = undefinedFn;
export { nullDecoder as null, undefinedDecoder as undefined };

/** Decoder that always succeeds with the provided value, ignoring its input. */
export const constant: <T>(value: T) => Decoder<T> = constantFn;

/** Decoder that always succeeds, returning its input as `any`. */
export const succeed: () => Decoder<any> = succeedFn;

/** Decoder that always fails with the given error message. */
export const fail: <T>(error: string) => Decoder<T> = failFn;

/** Decoder that only accepts the exact provided value. */
export const literal: <const T>(value: T) => Decoder<T> = literalFn;

/** Decoder for `enum` values. */
export const enumeration: <E>(enumObj: object) => Decoder<E> = enumerationFn;

/** Decoder for an empty object (`{}`). */
export const emptyObject: () => Decoder<EmptyObject> = emptyObjectFn;

/** Decoder for arrays whose elements all match `decoder`. */
export const array: <T>(decoder: Decoder<T>) => Decoder<Array<T>> = arrayFn;

/** Decoder for `Record<string, V>` values. */
export const record: <V>(decoder: Decoder<V>) => Decoder<{ [K: string]: V }> =
  recordFn;

/** Decoder that accepts the decoded value or `undefined`. */
export const optional: <T>(decoder: Decoder<T>) => Decoder<T | undefined> =
  optionalFn;

/** Decoder that accepts the decoded value or `null`. */
export const nullable: <T>(decoder: Decoder<T>) => Decoder<T | null> =
  nullableFn;

/** Decoder that falls back to `defaultValue` when `decoder` fails. */
export const fallback: <T>(defaultValue: T, decoder: Decoder<T>) => Decoder<T> =
  fallbackFn;

/** Decoder for recursive structures, resolving `mkDecoder` lazily. */
export const lazy: <T>(mkDecoder: () => Decoder<T>) => Decoder<T> = lazyFn;

// --- Builders whose precise types need a thin wrapper ----------------------

/**
 * Field spec for {@link object}: a decoder for the same JSON key, or `{ fromKey, decoder }` to read a different key.
 */
export type DecoderObject<T> = {
  [P in keyof Required<T>]:
    | Decoder<T[P]>
    | { fromKey: string; decoder: Decoder<T[P]> };
};

/** Field spec for {@link objectStrict}. Identical to {@link DecoderObject}. */
export type DecoderObjectStrict<T> = DecoderObject<T>;

// A `DecoderObject` is heterogeneous, so it has to be widened before its entries can be iterated.
// `d => d` is the identity: a mini decoder already is the plain function the shared factories take.
const fieldsOf = <T>(decoders: DecoderObject<T>) =>
  normalizeFields<Decoder<any>>(
    decoders as Record<string, FieldSpec<Decoder<any>>>,
    d => d
  );

/** Decoder for objects with the given field decoders. */
export function object<T>(decoders: DecoderObject<T>): Decoder<T> {
  return objectFn<T>(fieldsOf(decoders));
}

/** Like {@link object}, but fails when the input has unknown keys. */
export function objectStrict<T>(decoders: DecoderObjectStrict<T>): Decoder<T> {
  return objectStrictFn<T>(fieldsOf(decoders));
}

/** Maps each decoder in a tuple to the type it produces. */
export type TupleOfResults<T extends readonly [] | readonly Decoder<any>[]> =
  OutputsOf<T>;

/** Decoder for fixed-length, fixed-type tuples. */
export function tuple<T extends readonly [] | readonly Decoder<any>[]>(
  decoders: T
): Decoder<TupleOfResults<T>> {
  return tupleFn(decoders as ReadonlyArray<DecodeFn<any>>) as Decoder<
    TupleOfResults<T>
  >;
}

/** Intersection of every decoder's output in an {@link allOf}. */
export type AllOfOutput<T extends readonly Decoder<any>[]> =
  IntersectionOfOutputs<T>;

/** Decoder that succeeds only if every decoder succeeds, deep-merging results. */
export function allOf<T extends readonly Decoder<any>[]>(
  decoders: T
): Decoder<AllOfOutput<T>> {
  return allOfFn(decoders as ReadonlyArray<DecodeFn<any>>) as Decoder<
    AllOfOutput<T>
  >;
}

/**
 * Decoder that returns the first alternative to succeed.
 *
 * The output type is inferred as the union of the alternatives.
 * Pass an explicit type argument when you want to state the target type instead.
 *
 * @example
 * ```ts
 * oneOf([string(), number()]); // Decoder<string | number>
 * ```
 */
export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T>;
export function oneOf<D extends readonly Decoder<any>[]>(
  decoders: D
): Decoder<DecoderOutput<D[number]>>;
export function oneOf(decoders: ReadonlyArray<Decoder<any>>): Decoder<any> {
  return oneOfFn(decoders);
}

/** Decoder for tagged (discriminated) unions. */
export function discriminatedUnion<M extends Record<string, Decoder<any>>>(
  discriminant: string,
  mapping: M
): Decoder<FromDecoder<M[keyof M]>> {
  return discriminatedUnionFn(discriminant, mapping) as Decoder<
    FromDecoder<M[keyof M]>
  >;
}

// ---------------------------------------------------------------------------
// Operations on decoders
// ---------------------------------------------------------------------------

/**
 * Runs a decoder and returns a {@link Result} (never throws).
 *
 * @example
 * ```ts
 * const r = decode(string(), 'hi'); // Ok<string>
 * ```
 */
export function decode<T>(decoder: Decoder<T>, json: unknown): Result<T> {
  return decoder(json);
}

/**
 * Runs a decoder and returns the decoded value, throwing on failure.
 *
 * @throws {Error} An Error whose message describes the failure and whose `cause` holds the structured `DecodingIssue[]`.
 */
export function parse<T>(decoder: Decoder<T>, json: unknown): T {
  const result = decoder(json);
  if (result.isOk()) {
    return result.value;
  }
  throw new Error(formatIssues(result.issues), { cause: result.issues });
}

/**
 * Runs a decoder and resolves with the decoded value, rejecting on failure.
 */
export function decodePromise<T>(
  decoder: Decoder<T>,
  json: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const result = decoder(json);
    if (result.isOk()) {
      resolve(result.value);
    } else {
      reject(new Error(formatIssues(result.issues), { cause: result.issues }));
    }
  });
}

/**
 * Transforms the decoded value of a successful decoder.
 *
 * @example
 * ```ts
 * const date = map(string(), iso => new Date(iso));
 * ```
 */
export function map<T, O>(
  decoder: Decoder<T>,
  fn: (value: T) => O
): Decoder<O> {
  return (json: any) => {
    const result = decoder(json);
    return result.isOk() ? ok(fn(result.value)) : err<O>(result.issues);
  };
}

/**
 * Chains a decoder into another decoder that depends on the decoded value.
 *
 * @example
 * ```ts
 * const adult = flatMap(number(), age =>
 *   age >= 18 ? succeed() : fail(`Age ${age} is less than 18`)
 * );
 * ```
 */
export function flatMap<T, O>(
  decoder: Decoder<T>,
  fn: (value: T) => Decoder<O>
): Decoder<O> {
  return (json: any) => {
    const result = decoder(json);
    return result.isOk() ? fn(result.value)(json) : err<O>(result.issues);
  };
}

/**
 * Adapts a decoder into a [Standard Schema](https://standardschema.dev) so it drops into any Standard-Schema-aware tool.
 * Opt-in, so apps that don't use Standard Schema never bundle the adapter.
 *
 * @example
 * ```ts
 * const schema = toStandardSchema(object({ id: number() }));
 * schema['~standard'].validate({ id: 1 });
 * ```
 */
export function toStandardSchema<T>(
  decoder: Decoder<T>
): StandardSchemaV1<unknown, T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'ts.data.json',
      validate: (value: unknown): StandardSchemaV1.Result<T> => {
        const result = decoder(value);
        if (result.isOk()) {
          return { value: result.value };
        }
        return {
          issues: result.issues.map((issue: DecodingIssue) => ({
            message: issue.message,
            path:
              issue.path.length > 0
                ? issue.path.map(segment => ({ key: segment }))
                : undefined
          }))
        };
      }
    }
  };
}

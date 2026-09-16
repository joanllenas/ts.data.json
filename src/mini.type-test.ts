/**
 * Compile-time assertions for the inference of both entry points.
 *
 * `tsconfig.json` excludes `*.spec.ts`, so a type assertion written in a spec file is never checked.
 * This file is not a spec, so `tsc --noEmit` checks it.
 * Nothing imports it, so it is not part of either bundle.
 *
 * A wrong inference makes this file fail to compile.
 *
 * @module
 * @internal
 */

import * as J from './index';
import * as M from './mini';

/** True only when `A` and `B` are the same type, in both directions. */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// --- object -----------------------------------------------------------------

export const miniObject = M.object({ id: M.number(), name: M.string() });
export const miniObjectInfers: Exact<
  M.FromDecoder<typeof miniObject>,
  { id: number; name: string }
> = true;

export const classObject = J.object({ id: J.number(), name: J.string() });
export const classObjectInfers: Exact<
  J.FromDecoder<typeof classObject>,
  { id: number; name: string }
> = true;

// --- oneOf: infers the union of its alternatives -----------------------------

export const miniOneOf = M.oneOf([M.string(), M.number()]);
export const miniOneOfInfers: Exact<
  M.FromDecoder<typeof miniOneOf>,
  string | number
> = true;

export const classOneOf = J.oneOf([J.string(), J.number()]);
export const classOneOfInfers: Exact<
  J.FromDecoder<typeof classOneOf>,
  string | number
> = true;

// An explicit type argument still states the target type.
export const classOneOfExplicit = J.oneOf<string | number>([
  J.string(),
  J.number()
]);
export const classOneOfExplicitHolds: Exact<
  J.FromDecoder<typeof classOneOfExplicit>,
  string | number
> = true;

// --- tuple ------------------------------------------------------------------

export const miniTuple = M.tuple([M.number(), M.string()]);
export const miniTupleInfers: Exact<
  M.FromDecoder<typeof miniTuple>,
  [number, string]
> = true;

export const classTuple = J.tuple([J.number(), J.string()]);
export const classTupleInfers: Exact<
  J.FromDecoder<typeof classTuple>,
  [number, string]
> = true;

// --- allOf ------------------------------------------------------------------

export const miniAllOf = M.allOf([
  M.object({ a: M.number() }),
  M.object({ b: M.string() })
]);
export const miniAllOfInfers: Exact<
  M.FromDecoder<typeof miniAllOf>,
  { a: number } & { b: string }
> = true;

export const classAllOf = J.allOf([
  J.object({ a: J.number() }),
  J.object({ b: J.string() })
]);
export const classAllOfInfers: Exact<
  J.FromDecoder<typeof classAllOf>,
  { a: number } & { b: string }
> = true;

// --- discriminatedUnion -----------------------------------------------------

export const miniDiscriminated = M.discriminatedUnion('kind', {
  circle: M.object({ kind: M.literal('circle'), r: M.number() }),
  square: M.object({ kind: M.literal('square'), s: M.string() })
});
export const miniDiscriminatedInfers: Exact<
  M.FromDecoder<typeof miniDiscriminated>,
  { kind: 'circle'; r: number } | { kind: 'square'; s: string }
> = true;

// --- fromKey ----------------------------------------------------------------

export const miniFromKey = M.object<{ firstName: string }>({
  firstName: { fromKey: 'first_name', decoder: M.string() }
});
export const miniFromKeyInfers: Exact<
  M.FromDecoder<typeof miniFromKey>,
  { firstName: string }
> = true;

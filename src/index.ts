// Every export is named, not `export *`, so this file states the public surface.
// It is checked against `test/expected-exports.ts`.

export { Decoder, formatIssuePath, type FromDecoder } from './core';

// Primitives
export { string } from './schemas/string';
export { number } from './schemas/number';
export { boolean } from './schemas/boolean';
export { nullValue, null } from './schemas/null';
export { undefinedValue, undefined } from './schemas/undefined';
export { literal } from './schemas/literal';
export { enumeration } from './schemas/enum';

// Data structures
export { array } from './schemas/array';
export { tuple, type TupleOfResults } from './schemas/tuple';
export { object, type DecoderObject } from './schemas/object';
export {
  objectStrict,
  type DecoderObjectStrict
} from './schemas/object-strict';
export { record } from './schemas/record';
export { emptyObject, type EmptyObject } from './schemas/empty-object';

// Combinators
export { oneOf } from './schemas/one-of';
export {
  allOf,
  type AllOfOutput,
  type DecoderOutput,
  type UnionToIntersection
} from './schemas/all-of';
export { discriminatedUnion } from './schemas/discriminated-union';
export { optional } from './schemas/optional';
export { nullable } from './schemas/nullable';
export { lazy } from './schemas/lazy';

// Utils
export { constant } from './schemas/constant';
export { succeed } from './schemas/succeed';
export { fail } from './schemas/fail';
export { fallback } from './schemas/fallback';

// Results
export {
  Err,
  err,
  Ok,
  ok,
  type Result,
  type DecodingIssue
} from './utils/result';

/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { undefinedFn } from '../internal/schemas';

/**
 * Decoder for `undefined` values.
 *
 * @category Primitives
 * @returns A decoder that only accepts `undefined` values
 *
 * @example
 * ```ts
 * const undefinedDecoder = JsonDecoder.undefinedValue();
 * undefinedDecoder.decode(undefined); // Ok<undefined>({value: undefined})
 * undefinedDecoder.decode(123); // Err({ issues: [{ message: '123 is not undefined', path: [] }] })
 * undefinedDecoder.decode(null); // Err({ issues: [{ message: 'null is not undefined', path: [] }] })
 * ```
 * @category Primitives
 */
export function undefinedValue(): Decoder<undefined> {
  return new Decoder(undefinedFn());
}

// Deprecated alias so 4.x code calling `undefined()` keeps working. Removed in 5.0.0.
export { undefinedValue as undefined };

/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { nullFn } from '../internal/schemas';

/**
 * Decoder for `null` values.
 *
 * @category Primitives
 * @returns A decoder that only accepts `null` values
 *
 * @example
 * ```ts
 * const nullDecoder = JsonDecoder.nullValue();
 * nullDecoder.decode(null); // Ok<null>({value: null})
 * nullDecoder.decode(123); // Err({ issues: [{ message: '123 is not null', path: [] }] })
 * nullDecoder.decode(undefined); // Err({ issues: [{ message: 'undefined is not null', path: [] }] })
 * ```
 * @category Primitives
 */
export function nullValue(): Decoder<null> {
  return new Decoder(nullFn());
}

// Deprecated alias so 4.x code calling `null()` keeps working. Removed in 5.0.0.
export { nullValue as null };

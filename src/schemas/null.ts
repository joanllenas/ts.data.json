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
 * const nullDecoder = JsonDecoder.null();
 * nullDecoder.decode(null); // Ok<null>({value: null})
 * nullDecoder.decode(123); // Err({ issues: [{ message: '123 is not null', path: [] }] })
 * nullDecoder.decode(undefined); // Err({ issues: [{ message: 'undefined is not null', path: [] }] })
 * ```
 * @category Primitives
 */
function null_(): Decoder<null> {
  return new Decoder(nullFn());
}

export { null_ as null };

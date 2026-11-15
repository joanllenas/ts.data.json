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

// A bare `export { undefinedValue as undefined }` loses the tag in the emitted declarations.
/**
 * @deprecated Use {@link undefinedValue} instead. Removed in 5.0.0.
 * @category Primitives
 */
const undefinedAlias = undefinedValue;

export { undefinedAlias as undefined };

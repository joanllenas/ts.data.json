/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { stringFn } from '../internal/schemas';

/**
 * Decoder for `string` values.
 *
 * @category Primitives
 * @returns A decoder that validates and returns string values
 *
 * @example
 * ```ts
 * JsonDecoder.string().decode('hi'); // Ok<string>({value: 'hi'})
 * JsonDecoder.string().decode(5); // Err({ issues: [{ message: '"5" is not a valid string', path: [] }] })
 * ```
 */
export function string(): Decoder<string> {
  return new Decoder<string>(stringFn());
}

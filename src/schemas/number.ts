/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { numberFn } from '../internal/schemas';

/**
 * Decoder for `number` values.
 *
 * @category Primitives
 * @returns A decoder that validates and returns number values
 *
 * @example
 * ```ts
 * JsonDecoder.number().decode(99); // Ok<number>({value: 99})
 * JsonDecoder.number().decode('hola'); // Err({ issues: [{ message: '"hola" is not a valid number', path: [] }] })
 * ```
 */
export function number(): Decoder<number> {
  return new Decoder<number>(numberFn());
}

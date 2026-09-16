/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { arrayFn } from '../internal/schemas';

/**
 * Decoder for arrays.
 *
 * @category Data Structures
 * @param decoder The decoder for array elements
 * @returns A decoder that validates and returns arrays
 *
 * @example
 * ```ts
 * const numberArray = JsonDecoder.array(JsonDecoder.number());
 *
 * numberArray.decode([1, 2, 3]); // Ok<number[]>
 *
 * // All element failures are collected before returning:
 * numberArray.decode([1, '2', '3']);
 * // Err({ issues: [
 * //   { message: '"2" is not a valid number', path: [1] },
 * //   { message: '"3" is not a valid number', path: [2] }
 * // ] })
 * ```
 */
export function array<T>(decoder: Decoder<T>): Decoder<Array<T>> {
  return new Decoder<Array<T>>(arrayFn(Decoder.toDecodeFn(decoder)));
}

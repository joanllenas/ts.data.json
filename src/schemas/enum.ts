/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { enumerationFn } from '../internal/schemas';

/**
 * Decoder for `enumeration` values.
 *
 * @category Data Structures
 * @param enumObj The enum object to use for decoding. Must not be a const enum.
 * @returns A decoder that validates and returns enum values
 *
 * @example
 * ```ts
 * enum Color {
 *   Red = 'red',
 *   Blue = 'blue'
 * }
 *
 * const colorDecoder = JsonDecoder.enumeration(Color);
 * colorDecoder.decode('red'); // Ok<Color>
 * // The rejected value is rendered with JSON.stringify, so a string keeps its quotes...
 * colorDecoder.decode('green'); // Err with issues: [{ message: '"green" is not a valid enum value', path: [] }]
 * // ...while a non-string value (here a number) is rendered without quotes.
 * colorDecoder.decode(42); // Err with issues: [{ message: '42 is not a valid enum value', path: [] }]
 * ```
 */
export function enumeration<E>(enumObj: object): Decoder<E> {
  return new Decoder<E>(enumerationFn<E>(enumObj));
}

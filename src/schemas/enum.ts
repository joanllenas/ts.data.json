/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

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
 * colorDecoder.decode('green'); // Err with issues: [{ message: '"green" is not a valid enum value', path: [] }]
 * ```
 */
export function enumeration<E>(enumObj: object): Decoder<E> {
  return new Decoder<E>((json: any) => {
    const enumValue = Object.values(enumObj).find((x: any) => x === json);
    if (enumValue !== undefined) {
      return Result.ok<E>(enumValue);
    }
    return Result.err<E>([{ message: `"${json}" is not a valid enum value`, path: [] }]);
  });
}

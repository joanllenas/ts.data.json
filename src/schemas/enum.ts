/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { $JsonDecoderErrors } from '../utils/errors';

/**
 * Decoder for `enumeration` values.
 *
 * @category Data Structures
 * @param enumObj The enum object to use for decoding. Must not be a const enum.
 * @param decoderName How to display the name of the object being decoded in errors.
 * @returns A decoder that validates and returns enum values
 *
 * @example
 * ```ts
 * enum Color {
 *   Red = 'red',
 *   Blue = 'blue'
 * }
 *
 * const colorDecoder = JsonDecoder.enumeration(Color, 'Color');
 * colorDecoder.decode('red'); // Ok<Color>({value: Color.Red})
 * colorDecoder.decode('green'); // Err({error: '<Color> decoder failed at value "green" which is not in the enum'})
 * ```
 */
export function enumeration<E>(
  enumObj: object,
  decoderName: string
): Decoder<E> {
  return new Decoder<E>((json: any) => {
    const enumValue = Object.values(enumObj).find((x: any) => x === json);
    if (enumValue !== undefined) {
      return Result.ok<E>(enumValue);
    }
    return Result.err<E>($JsonDecoderErrors.enumValueError(decoderName, json));
  });
}

/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import { $JsonDecoderErrors } from '../utils/errors';
import * as Result from '../utils/result';

/**
 * Decoder for arrays.
 *
 * @category Data Structures
 * @param decoder The decoder for array elements
 * @param decoderName How to display the name of the object being decoded in errors
 * @returns A decoder that validates and returns arrays
 *
 * @example
 * ```ts
 * const numberArray = JsonDecoder.array(JsonDecoder.number, 'NumberArray');
 *
 * numberArray.decode([1, 2, 3]); // Ok<number[]>
 * numberArray.decode([1, '2', 3]); // Err({error: '<NumberArray> decoder failed at index "1" with error: "2" is not a valid number'})
 * ```
 */
export const array = <T>(
  decoder: Decoder<T>,
  decoderName: string
): Decoder<Array<T>> => {
  return new Decoder<Array<T>>(json => {
    if (json instanceof Array) {
      const arr: Array<T> = [];
      for (let i = 0; i < json.length; i++) {
        const result = decoder.decode(json[i]);
        if (result.isOk()) {
          arr.push(result.value);
        } else {
          return Result.err<Array<T>>(
            $JsonDecoderErrors.arrayError(decoderName, i, result.error)
          );
        }
      }
      return Result.ok<Array<T>>(arr);
    } else {
      return Result.err<Array<T>>(
        $JsonDecoderErrors.primitiveError(json, 'array')
      );
    }
  });
};

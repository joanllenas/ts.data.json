/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { $JsonDecoderErrors } from '../utils/errors';

/**
 * Decoder for `number` values.
 *
 * @category Primitives
 * @returns A decoder that validates and returns number values
 *
 * @example
 * ```ts
 * JsonDecoder.number().decode(99); // Ok<number>({value: 99})
 * JsonDecoder.number().decode('hola'); // Err({error: 'hola is not a valid number'})
 * ```
 */
export function number(): Decoder<number> {
  return new Decoder<number>((json: any) => {
    if (typeof json === 'number') {
      return Result.ok<number>(json);
    } else {
      return Result.err<number>(
        $JsonDecoderErrors.primitiveError(json, 'number')
      );
    }
  });
}

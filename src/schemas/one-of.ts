/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { oneOfError } from '../errors/one-of-error';

/**
 * Decoder that tries multiple decoders in sequence until one succeeds.
 *
 * @category Utils
 * @param decoders Array of decoders to try in sequence
 * @param decoderName How to display the name of the object being decoded in errors
 * @returns A decoder that tries each decoder in sequence until one succeeds
 *
 * @example
 * ```ts
 * const stringOrNumber = JsonDecoder.oneOf<string | number>(
 *   [JsonDecoder.string(), JsonDecoder.number()],
 *   'StringOrNumber'
 * );
 *
 * stringOrNumber.decode('hello'); // Ok<string>({value: 'hello'})
 * stringOrNumber.decode(42); // Ok<number>({value: 42})
 * stringOrNumber.decode(true); // Err({error: '<StringOrNumber> decoder failed because true is not a valid value'})
 * ```
 */
export function oneOf<T>(
  decoders: Array<Decoder<T>>,
  decoderName: string
): Decoder<T> {
  return new Decoder<T>((json: any) => {
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i].decode(json);
      if (result.isOk()) {
        return result;
      }
    }
    return Result.err<T>(oneOfError(decoderName, json));
  });
}

/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that tries multiple decoders in sequence until one succeeds.
 *
 * @category Utils
 * @param decoders Array of decoders to try in sequence
 * @returns A decoder that tries each decoder in sequence until one succeeds
 *
 * @example
 * ```ts
 * const stringOrNumber = JsonDecoder.oneOf<string | number>([
 *   JsonDecoder.string(),
 *   JsonDecoder.number()
 * ]);
 *
 * stringOrNumber.decode('hello'); // Ok<string>
 * stringOrNumber.decode(42); // Ok<number>
 * stringOrNumber.decode(true); // Err with issues: [{ message: 'true could not be decoded with any of the provided decoders', path: [] }]
 * ```
 */
export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
  return new Decoder<T>((json: any) => {
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i].decode(json);
      if (result.isOk()) {
        return result;
      }
    }
    return Result.err<T>([
      {
        message: `${JSON.stringify(json)} could not be decoded with any of the provided decoders`,
        path: []
      }
    ]);
  });
}

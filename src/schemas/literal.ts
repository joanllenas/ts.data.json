/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that only accepts a specific value.
 *
 * @category Utils
 * @param value The exact value to accept
 * @returns A decoder that only accepts the specified value
 *
 * @example
 * ```ts
 * const oneDecoder = JsonDecoder.literal(1);
 *
 * oneDecoder.decode(1); // Ok<1>({value: 1})
 * oneDecoder.decode(2); // Err({ issues: [{ message: '2 is not exactly 1', path: [] }] })
 * ```
 */
export function literal<const T>(value: T): Decoder<T> {
  return new Decoder((json: any) => {
    if (json === value) {
      return Result.ok<T>(value);
    } else {
      return Result.err<T>([
        {
          message: `${JSON.stringify(json)} is not exactly ${JSON.stringify(value)}`,
          path: []
        }
      ]);
    }
  });
}

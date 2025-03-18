/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import { $JsonDecoderErrors } from '../utils/errors';
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
 * oneDecoder.decode(1); // Ok<number>({value: 1})
 * oneDecoder.decode(2); // Err({error: '2 is not exactly 1'})
 * ```
 */
export function literal<T>(value: T): Decoder<T> {
  return new Decoder((json: any) => {
    if (json === value) {
      return Result.ok<T>(value);
    } else {
      return Result.err<T>($JsonDecoderErrors.exactlyError(json, value));
    }
  });
}

/**
 * Alias for the `literal` function.
 * @category Utils
 * @deprecated Use `literal` directly instead.
 */
export const isExactly = literal;

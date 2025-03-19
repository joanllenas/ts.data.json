/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that falls back to a default value if the given decoder fails.
 *
 * @category Transformations
 * @param defaultValue The value to return if the decoder fails
 * @param decoder The decoder to try first
 * @returns A decoder that returns the default value if the given decoder fails
 *
 * @example
 * ```ts
 * const numberOrZero = JsonDecoder.fallback(0, JsonDecoder.number);
 * numberOrZero.decode(42); // Ok<number>({value: 42})
 * numberOrZero.decode('not a number'); // Ok<number>({value: 0})
 * ```
 */
export function fallback<T>(defaultValue: T, decoder: Decoder<T>): Decoder<T> {
  return new Decoder<T>((json: any) => {
    const result = decoder.decode(json);
    if (result.isOk()) {
      return result;
    } else {
      return Result.ok<T>(defaultValue);
    }
  });
}

/**
 * Alias for the `fallback` function.
 *
 * @category Transformations
 * @deprecated Use `fallback` directly instead.
 * @ignore
 */
export const failover = fallback;

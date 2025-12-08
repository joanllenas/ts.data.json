/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { exactlyError } from '../errors/exactly-error';
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
 * oneDecoder.decode(2); // Err({error: '2 is not exactly 1'})
 * ```
 */
export function literal<const T>(value: T): Decoder<T> {
  return new Decoder((json: any) => {
    if (json === value) {
      return Result.ok<T>(value);
    } else {
      return Result.err<T>(exactlyError(json, value));
    }
  });
}

/* v8 ignore next */
/**
 * Alias for the `literal` function.
 * @category Utils
 * @deprecated Use `literal` directly instead.
 * @ignore
 */
export function isExactly<const T>(value: T): Decoder<T> {
  return literal(value);
}

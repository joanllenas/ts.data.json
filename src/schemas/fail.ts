/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that always fails with the given error message.
 *
 * @category Utils
 * @param error The error message to return
 * @returns A decoder that always fails with the specified error
 *
 * @example
 * ```ts
 * const failDecoder = JsonDecoder.fail<string>('This decoder always fails');
 * failDecoder.decode('anything'); // Err({error: 'This decoder always fails'})
 * ```
 */
export function fail<T>(error: string): Decoder<T> {
  return new Decoder<T>(() => {
    return Result.err<any>(error);
  });
}

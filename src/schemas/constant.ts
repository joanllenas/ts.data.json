/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that always succeeds with the specific provided value.
 *
 * @category Utils
 * @param value The constant value
 * @returns A decoder that always succeeds with the provided value
 *
 * @example
 * ```ts
 * const trueDecoder = JsonDecoder.constant(true);
 *
 * trueDecoder.decode(true); // Ok<boolean>({value: true})
 * trueDecoder.decode(false); // Ok<boolean>({value: true})
 * trueDecoder.decode("hello"); // Ok<boolean>({value: "true"})
 * ```
 */
export const constant = <T>(value: T): Decoder<T> => {
  return new Decoder<T>(() => Result.ok(value));
};

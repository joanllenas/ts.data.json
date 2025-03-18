/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that always succeeds with the given value.
 *
 * @category Utils
 * @returns A decoder that always succeeds
 *
 * @example
 * ```ts
 * const succeedDecoder = JsonDecoder.succeed;
 * succeedDecoder.decode('anything'); // Ok<any>({value: 'anything'})
 * ```
 */
export const succeed: Decoder<any> = new Decoder<any>((json: any) => {
  return Result.ok<any>(json);
});

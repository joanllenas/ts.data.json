/**
 * @module
 * @mergeModuleWith decoders
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
 * JsonDecoder.succeed().decode('anything'); // Ok<any>({value: 'anything'});
 * JsonDecoder.succeed().decode(34); // Ok<any>({value: 34});
 * ```
 */
export function succeed(): Decoder<any> {
  return new Decoder<any>((json: any) => {
    return Result.ok<any>(json);
  });
}

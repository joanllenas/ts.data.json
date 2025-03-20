/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { undefinedError } from '../errors/undefined-error';
import * as Result from '../utils/result';

/**
 * Decoder for `undefined` values.
 *
 * @category Primitives
 * @returns A decoder that only accepts `undefined` values
 *
 * @example
 * ```ts
 * const undefinedDecoder = JsonDecoder.undefined();
 * undefinedDecoder.decode(undefined); // Ok<undefined>({value: undefined})
 * undefinedDecoder.decode(123); // Err({error: '123 is not a valid undefined'})
 * undefinedDecoder.decode(null); // Err({error: 'null is not a valid undefined'})
 * ```
 * @category Primitives
 */
function undefined_(): Decoder<undefined> {
  return new Decoder((json: any) => {
    if (json === undefined) {
      return Result.ok<undefined>(undefined);
    } else {
      return Result.err<undefined>(undefinedError(json));
    }
  });
}

export { undefined_ as undefined };

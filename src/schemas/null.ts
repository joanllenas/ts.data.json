/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { $JsonDecoderErrors } from '../utils/errors';
import * as Result from '../utils/result';

/**
 * Decoder for `null` values.
 *
 * @category Primitives
 * @returns A decoder that only accepts `null` values
 *
 * @example
 * ```ts
 * const nullDecoder = JsonDecoder.null();
 * nullDecoder.decode(null); // Ok<null>({value: null})
 * nullDecoder.decode(123); // Err({error: '123 is not a valid null'})
 * nullDecoder.decode(undefined); // Err({error: 'undefined is not a valid null'})
 * ```
 * @category Primitives
 */
function null_(): Decoder<null> {
  return new Decoder((json: any) => {
    if (json === null) {
      return Result.ok<null>(null);
    } else {
      return Result.err<null>($JsonDecoderErrors.nullError(json));
    }
  });
}

export { null_ as null };

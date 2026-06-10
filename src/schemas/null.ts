/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
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
 * nullDecoder.decode(123); // Err({ issues: [{ message: '123 is not null', path: [] }] })
 * nullDecoder.decode(undefined); // Err({ issues: [{ message: 'undefined is not null', path: [] }] })
 * ```
 * @category Primitives
 */
function null_(): Decoder<null> {
  return new Decoder((json: any) => {
    if (json === null) {
      return Result.ok<null>(null);
    } else {
      return Result.err<null>([{ message: `${JSON.stringify(json)} is not null`, path: [] }]);
    }
  });
}

export { null_ as null };

/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
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
 * undefinedDecoder.decode(123); // Err({ issues: [{ message: '123 is not undefined', path: [] }] })
 * undefinedDecoder.decode(null); // Err({ issues: [{ message: 'null is not undefined', path: [] }] })
 * ```
 * @category Primitives
 */
function undefined_(): Decoder<undefined> {
  return new Decoder((json: any) => {
    if (json === undefined) {
      return Result.ok<undefined>(undefined);
    } else {
      return Result.err<undefined>([{ message: `${JSON.stringify(json)} is not undefined`, path: [] }]);
    }
  });
}

export { undefined_ as undefined };

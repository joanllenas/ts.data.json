/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { $JsonDecoderErrors } from '../utils/errors';

/**
 * Decoder for `string` values.
 *
 * @category Primitives
 * @returns A decoder that validates and returns string values
 *
 * @example
 * ```ts
 * JsonDecoder.string().decode('hi'); // Ok<string>({value: 'hi'})
 * JsonDecoder.string().decode(5); // Err({error: '5 is not a valid string'})
 * ```
 */
export const string = (): Decoder<string> =>
  new Decoder<string>((json: any) => {
    if (typeof json === 'string') {
      return Result.ok<string>(json);
    } else {
      return Result.err<string>(
        $JsonDecoderErrors.primitiveError(json, 'string')
      );
    }
  });

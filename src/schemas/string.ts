/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { primitiveError } from '../errors/primitive-error';

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
export function string(): Decoder<string> {
  return new Decoder<string>((json: any) => {
    if (typeof json === 'string') {
      return Result.ok<string>(json);
    } else {
      return Result.err<string>(primitiveError(json, 'string'));
    }
  });
}

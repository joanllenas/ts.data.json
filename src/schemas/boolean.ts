/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { primitiveError } from '../utils/errors';

/**
 * Decoder for `boolean` values.
 *
 * @category Primitives
 * @returns A decoder that validates and returns boolean values
 *
 * @example
 * ```ts
 * JsonDecoder.boolean().decode(true); // Ok<boolean>({value: true})
 * JsonDecoder.boolean().decode('true'); // Err({ issues: [{ message: '"true" is not a valid boolean', path: [] }] })
 * ```
 */
export function boolean(): Decoder<boolean> {
  return new Decoder<boolean>((json: any) => {
    if (typeof json === 'boolean') {
      return Result.ok<boolean>(json);
    } else {
      return Result.err<boolean>(primitiveError(json, 'boolean'));
    }
  });
}

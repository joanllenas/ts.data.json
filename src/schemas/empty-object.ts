/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { $JsonDecoderErrors } from '../utils/errors';

type EmptyObject = Record<string, never>;
/**
 * Decoder for an empty object ({}).
 *
 * @category Data Structures
 * @returns A decoder that validates and returns empty objects
 *
 * @example
 * ```ts
 * JsonDecoder.emptyObject.decode({}); // Ok<EmptyObject>({value: {}})
 * JsonDecoder.emptyObject.decode({a: 1}); // Err({error: '{a: 1} is not a valid empty object'})
 * ```
 */
export const emptyObject: Decoder<EmptyObject> = new Decoder<EmptyObject>(
  (json: any) => {
    if (
      json !== null &&
      typeof json === 'object' &&
      Object.keys(json).length === 0
    ) {
      return Result.ok<EmptyObject>(json);
    } else {
      return Result.err<EmptyObject>(
        $JsonDecoderErrors.primitiveError(json, 'empty object')
      );
    }
  }
);

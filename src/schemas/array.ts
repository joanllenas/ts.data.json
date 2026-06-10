/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { primitiveError, prependPath } from '../utils/errors';
import * as Result from '../utils/result';

/**
 * Decoder for arrays.
 *
 * @category Data Structures
 * @param decoder The decoder for array elements
 * @returns A decoder that validates and returns arrays
 *
 * @example
 * ```ts
 * const numberArray = JsonDecoder.array(JsonDecoder.number());
 *
 * numberArray.decode([1, 2, 3]); // Ok<number[]>
 * numberArray.decode([1, '2', 3]); // Err with issues: [{ message: '"2" is not a valid number', path: [1] }]
 * ```
 */
export function array<T>(decoder: Decoder<T>): Decoder<Array<T>> {
  return new Decoder<Array<T>>(json => {
    if (json instanceof Array) {
      const arr: Array<T> = [];
      const allIssues: Result.DecodingIssue[] = [];
      for (let i = 0; i < json.length; i++) {
        const result = decoder.decode(json[i]);
        if (result.isOk()) {
          arr.push(result.value);
        } else {
          allIssues.push(...prependPath(result.issues, i));
        }
      }
      if (allIssues.length > 0) {
        return Result.err<Array<T>>(allIssues);
      }
      return Result.ok<Array<T>>(arr);
    } else {
      return Result.err<Array<T>>(primitiveError(json, 'array'));
    }
  });
}

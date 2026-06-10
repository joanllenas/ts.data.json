/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { primitiveError } from '../utils/errors';
import { Err } from '../utils/result';
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
      for (let i = 0; i < json.length; i++) {
        const result = decoder.decode(json[i]);
        if (result.isOk()) {
          arr.push(result.value);
        } else {
          const issues = (result as Err<unknown>).issues.map(issue => ({
            message: issue.message,
            path: [i, ...issue.path]
          }));
          return Result.err<Array<T>>(issues);
        }
      }
      return Result.ok<Array<T>>(arr);
    } else {
      return Result.err<Array<T>>(primitiveError(json, 'array'));
    }
  });
}

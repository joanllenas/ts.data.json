/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { primitiveError, prependPath } from '../utils/errors';
import * as Result from '../utils/result';

/**
 * Decoder for record types with string keys.
 *
 * @category Data Structures
 * @param decoder The decoder for the record values
 * @returns A decoder that validates and returns a record with string keys
 *
 * @example
 * ```ts
 * const numberRecord = JsonDecoder.record(JsonDecoder.number());
 *
 * numberRecord.decode({a: 1, b: 2}); // Ok<Record<string, number>>
 *
 * // All value failures are collected before returning:
 * numberRecord.decode({a: '1', b: '2'});
 * // Err({ issues: [
 * //   { message: '"1" is not a valid number', path: ['a'] },
 * //   { message: '"2" is not a valid number', path: ['b'] }
 * // ] })
 * ```
 */
export function record<V>(decoder: Decoder<V>): Decoder<{ [K: string]: V }> {
  return new Decoder<{ [K: string]: V }>(json => {
    if (json !== null && typeof json === 'object') {
      const obj: { [K: string]: V } = {};
      const allIssues: Result.DecodingIssue[] = [];
      for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
          const result = decoder.decode(json[key]);
          if (result.isOk()) {
            obj[key] = result.value;
          } else {
            allIssues.push(...prependPath(result.issues, key));
          }
        }
      }
      if (allIssues.length > 0) {
        return Result.err<{ [K: string]: V }>(allIssues);
      }
      return Result.ok<{ [K: string]: V }>(obj);
    } else {
      return Result.err<{ [K: string]: V }>(primitiveError(json, 'object'));
    }
  });
}

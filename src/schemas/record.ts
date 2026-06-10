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
 * numberRecord.decode({a: '1', b: 2}); // Err with issues: [{ message: '"1" is not a valid number', path: ['a'] }]
 * ```
 */
export function record<V>(decoder: Decoder<V>): Decoder<{ [K: string]: V }> {
  return new Decoder<{ [K: string]: V }>(json => {
    if (json !== null && typeof json === 'object') {
      const obj: { [K: string]: V } = {};
      for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
          const result = decoder.decode(json[key]);
          if (result.isOk()) {
            obj[key] = result.value;
          } else {
            const issues = (result as Err<unknown>).issues.map(issue => ({
              message: issue.message,
              path: [key, ...issue.path]
            }));
            return Result.err<{ [K: string]: V }>(issues);
          }
        }
      }
      return Result.ok<{ [K: string]: V }>(obj);
    } else {
      return Result.err<{ [K: string]: V }>(primitiveError(json, 'object'));
    }
  });
}

/* v8 ignore start */
/**
 * Alias for the `record` function.
 *
 * @category Data Structures
 * @deprecated Use `record` directly instead.
 * @ignore
 */
export function dictionary<V>(decoder: Decoder<V>): Decoder<{ [K: string]: V }> {
  return record(decoder);
}
/* v8 ignore stop */

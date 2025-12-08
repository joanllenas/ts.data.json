/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { primitiveError } from '../errors/primitive-error';
import { recordError } from '../errors/record-error';
import * as Result from '../utils/result';

/**
 * Decoder for record types with string keys.
 *
 * @category Data Structures
 * @param decoder The decoder for the record values
 * @param decoderName How to display the name of the object being decoded in errors
 * @returns A decoder that validates and returns a record with string keys
 *
 * @example
 * ```ts
 * const numberRecord = JsonDecoder.record(JsonDecoder.number(), 'NumberRecord');
 *
 * numberRecord.decode({a: 1, b: 2}); // Ok<Record<string, number>>
 * numberRecord.decode({a: '1', b: 2}); // Err({error: '<NumberRecord> record decoder failed at key "a" with error: "1" is not a valid number'})
 * ```
 */
export function record<V>(
  decoder: Decoder<V>,
  decoderName: string
): Decoder<{ [K: string]: V }> {
  return new Decoder<{ [K: string]: V }>(json => {
    if (json !== null && typeof json === 'object') {
      const obj: { [K: string]: V } = {};
      for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
          const result = decoder.decode(json[key]);
          if (result.isOk()) {
            obj[key] = result.value;
          } else {
            return Result.err<{ [K: string]: V }>(
              recordError(decoderName, key, result.error)
            );
          }
        }
      }
      return Result.ok<{ [K: string]: V }>(obj);
    } else {
      return Result.err<{ [K: string]: V }>(primitiveError(json, decoderName));
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
export function dictionary<V>(
  decoder: Decoder<V>,
  decoderName: string
): Decoder<{ [K: string]: V }> {
  return record(decoder, decoderName);
}
/* v8 ignore stop */

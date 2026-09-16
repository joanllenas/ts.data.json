/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { recordFn } from '../internal/schemas';

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
  return new Decoder<{ [K: string]: V }>(recordFn(Decoder.toDecodeFn(decoder)));
}

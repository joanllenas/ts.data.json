/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { nullableFn } from '../internal/schemas';

/**
 * Decoder that accepts null values.
 *
 * @category Utils
 * @param decoder The decoder for the non-null value
 * @returns A decoder that accepts either the decoded value or null
 *
 * @example
 * ```ts
 * interface User {
 *   name: string;
 *   age: number | null;
 * }
 *
 * const userDecoder = JsonDecoder.object<User>(
 *   {
 *     name: JsonDecoder.string(),
 *     age: JsonDecoder.nullable(JsonDecoder.number())
 *   },
 *   'User'
 * );
 *
 * userDecoder.decode({name: 'John', age: null}); // Ok<User>
 * userDecoder.decode({name: 'John', age: 30}); // Ok<User>
 * ```
 */
export function nullable<T>(decoder: Decoder<T>): Decoder<T | null> {
  return new Decoder<T | null>(nullableFn(Decoder.toDecodeFn(decoder)));
}

/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

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
  return new Decoder<T | null>((json: any) => {
    if (json === null) {
      return Result.ok<T | null>(null);
    }
    return decoder.decode(json);
  });
}

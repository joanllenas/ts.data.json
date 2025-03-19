/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that makes a field optional.
 *
 * @category Utils
 * @param decoder The decoder for the field when it is present
 * @returns A decoder that accepts either the decoded value or undefined
 *
 * @example
 * ```ts
 * interface User {
 *   name: string;
 *   age?: number;
 * }
 *
 * const userDecoder = JsonDecoder.object<User>(
 *   {
 *     name: JsonDecoder.string,
 *     age: JsonDecoder.optional(JsonDecoder.number)
 *   },
 *   'User'
 * );
 *
 * userDecoder.decode({name: 'John'}); // Ok<User>
 * userDecoder.decode({name: 'John', age: 30}); // Ok<User>
 * ```
 */
export function optional<T>(decoder: Decoder<T>): Decoder<T | undefined> {
  return new Decoder<T | undefined>((json: any) => {
    if (json === undefined) {
      return Result.ok<undefined>(undefined);
    } else {
      return decoder.decode(json);
    }
  });
}

/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { $JsonDecoderErrors } from '../utils/errors';

/**
 * Represents an object with specified field decoders that fails if unknown fields are present.
 *
 * @category Internal Types
 */
export type DecoderObjectStrict<T> = {
  [P in keyof Required<T>]: Decoder<T[P]>;
};

/**
 * Decoder for objects with specified field decoders that fails if unknown fields are present.
 *
 * @category Data Structures
 * @param decoders Key/value pairs of decoders for each object field.
 * @param decoderName How to display the name of the object being decoded in errors.
 * @returns A decoder that validates and returns objects matching the specified structure, failing if unknown fields are present
 *
 * @example
 * ```ts
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * const userDecoder = JsonDecoder.objectStrict<User>(
 *   {
 *     name: JsonDecoder.string,
 *     age: JsonDecoder.number
 *   },
 *   'User'
 * );
 *
 * userDecoder.decode({name: 'John', age: 30}); // Ok<User>
 * userDecoder.decode({name: 'John', age: 30, extra: 'field'}); // Err({error: 'Unknown key "extra" found while processing strict <User> decoder'})
 * ```
 */
export function objectStrict<T>(
  decoders: DecoderObjectStrict<T>,
  decoderName: string
): Decoder<T> {
  return new Decoder<T>((json: any) => {
    if (json !== null && typeof json === 'object') {
      for (const key in json) {
        if (!Object.prototype.hasOwnProperty.call(decoders, key)) {
          return Result.err<T>(
            $JsonDecoderErrors.objectStrictUnknownKeyError(decoderName, key)
          );
        }
      }
      const result: any = {};
      for (const key in decoders) {
        if (Object.prototype.hasOwnProperty.call(decoders, key)) {
          const r = decoders[key].decode(json[key]);
          if (r.isOk()) {
            result[key] = r.value;
          } else {
            return Result.err<T>(
              $JsonDecoderErrors.objectError(decoderName, key, r.error)
            );
          }
        }
      }
      return Result.ok<T>(result);
    } else {
      return Result.err<T>(
        $JsonDecoderErrors.primitiveError(json, decoderName)
      );
    }
  });
}

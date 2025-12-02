/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { objectError } from '../errors/object-error';
import { objectStrictUnknownKeyError } from '../errors/object-strict-unknown-key-error';
import { primitiveError } from '../errors/primitive-error';
import * as Result from '../utils/result';

/**
 * Represents an object that maps properties of a TypeScript type `T` to
 * decoders used to validate raw JSON values. Each property may either be a
 * `Decoder<T[P]>` (decoding a field from the same key in the input JSON) or
 * an object with `fromKey` and `decoder` to decode from a different input
 * key.
 *
 * For the strict variant, the decoder will fail if any keys in the incoming
 * JSON are not present among the resulting set of JSON keys derived from
 * the provided decoders. When a decoder uses `fromKey`, the allowed JSON key
 * is `fromKey` rather than the TypeScript property name.
 *
 * @example
 * ```ts
 * interface User { firstName: string; lastName: string; age: number }
 *
 * const decoders: DecoderObjectStrict<User> = {
 *   firstName: { fromKey: 'first_name', decoder: JsonDecoder.string() },
 *   lastName: { fromKey: 'last_name', decoder: JsonDecoder.string() },
 *   age: JsonDecoder.number()
 * };
 * ```
 *
 * @category Internal Types
 */
export type DecoderObjectStrict<T> = {
  [P in keyof Required<T>]:
    | Decoder<T[P]>
    | { fromKey: string; decoder: Decoder<T[P]> };
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
 *     name: JsonDecoder.string(),
 *     age: JsonDecoder.number()
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
      // Build an allowed JSON key set from provided decoders. If a decoder
      // entry uses `{ fromKey, decoder }`, then the allowed JSON key for that
      // property is `fromKey`. Otherwise the allowed key is the TypeScript
      // property name (the key of `decoders`).
      const allowedKeys = new Set<string>();
      for (const key in decoders) {
        if (Object.prototype.hasOwnProperty.call(decoders, key)) {
          const decoderObject = decoders[key];
          if (decoderObject instanceof Decoder) {
            allowedKeys.add(key);
          } else {
            allowedKeys.add(decoderObject.fromKey);
          }
        }
      }
      for (const key in json) {
        if (!allowedKeys.has(key)) {
          return Result.err<T>(objectStrictUnknownKeyError(decoderName, key));
        }
      }
      const result: any = {};
      for (const key in decoders) {
        if (Object.prototype.hasOwnProperty.call(decoders, key)) {
          let r;
          const decoderObject = decoders[key];
          if (decoderObject instanceof Decoder) {
            r = decoderObject.decode(json[key]);
          } else {
            r = decoderObject.decoder.decode(json[decoderObject.fromKey]);
          }
          if (r.isOk()) {
            result[key] = r.value;
          } else {
            return Result.err<T>(objectError(decoderName, key, r.error));
          }
        }
      }
      return Result.ok<T>(result);
    } else {
      return Result.err<T>(primitiveError(json, decoderName));
    }
  });
}

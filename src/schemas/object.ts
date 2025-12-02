/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { objectError } from '../errors/object-error';
import { primitiveError } from '../errors/primitive-error';
import * as Result from '../utils/result';

/**
 * Represents an object that maps properties of a TypeScript type `T` to
 * decoders used to validate raw JSON values. Each property may either be a
 * `Decoder<T[P]>` (decoding a field from the same key in the input JSON) or
 * an object with `fromKey` and `decoder` to decode from a different input
 * key.
 *
 * The `fromKey` option is useful when your TypeScript property name differs
 * from the incoming JSON key (for example, snake_case JSON keys mapped to
 * camelCase TypeScript properties). Errors reported still reference the
 * TypeScript property name (the key of `DecoderObject`).
 *
 * @example
 * ```ts
 * // Example where the JSON has `first_name`, but our TypeScript property is `firstName`
 * interface User { firstName: string; lastName: string; age: number }
 *
 * const decoders: DecoderObject<User> = {
 *   firstName: { fromKey: 'first_name', decoder: JsonDecoder.string() },
 *   lastName: { fromKey: 'last_name', decoder: JsonDecoder.string() },
 *   age: JsonDecoder.number()
 * };
 * ```
 *
 * @category Internal Types
 */
export type DecoderObject<T> = {
  [P in keyof Required<T>]:
    | Decoder<T[P]>
    | { fromKey: string; decoder: Decoder<T[P]> };
};

/**
 * Decoder for objects with specified field decoders. Supports mapping a
 * TypeScript property to a different JSON key via a `{ fromKey, decoder }`
 * entry in the `decoders` map.
 *
 * @category Data Structures
 * @param decoders Key/value pairs of decoders for each object field.
 * @param decoderName How to display the name of the object being decoded in errors.
 * @returns A decoder that validates and returns objects matching the specified structure
 *
 * @example
 * ```ts
 * interface User {
 *   firstName: string;
 *   lastName: string;
 *   age: number;
 * }
 *
 * const userDecoder = JsonDecoder.object<User>(
 *   {
 *     firstName: JsonDecoder.string(),
 *     lastName: JsonDecoder.string(),
 *     age: JsonDecoder.number()
 *   },
 *   'User'
 * );
 *
 * const json = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   age: 30
 * };
 *
 * userDecoder.decode(json); // Ok<User>({value: {firstName: 'John', lastName: 'Doe', age: 30}})
 * ```
 *
 * @example
 * ```ts
 * // You can also use `fromKey` to map TypeScript properties to different JSON keys
 * const userDecoder = JsonDecoder.object<User>(
 *   {
 *     firstName: { fromKey: 'first_name', decoder: JsonDecoder.string() },
 *     lastName: { fromKey: 'last_name', decoder: JsonDecoder.string() },
 *     age: JsonDecoder.number()
 *   },
 *   'User'
 * );
 * ```
 */
export function object<T>(
  decoders: DecoderObject<T>,
  decoderName: string
): Decoder<T> {
  return new Decoder<T>((json: any) => {
    if (json !== null && typeof json === 'object') {
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

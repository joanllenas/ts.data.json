/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { $JsonDecoderErrors } from '../utils/errors';

/**
 * Represents an object with specified field decoders.
 *
 * @category Internal Types
 */
export type DecoderObject<T> = { [P in keyof Required<T>]: Decoder<T[P]> };

/**
 * Decoder for objects with specified field decoders.
 *
 * @category Data Structures
 * @param decoders Key/value pairs of decoders for each object field.
 * @param decoderName How to display the name of the object being decoded in errors.
 * @param keyMap Optional map between json field names and user land field names.
 *               Useful when the client model does not match with the input JSON structure.
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

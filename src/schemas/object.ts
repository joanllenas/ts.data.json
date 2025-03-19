/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';
import { $JsonDecoderErrors } from '../utils/errors';

type DecoderObject<T> = { [P in keyof Required<T>]: Decoder<T[P]> };

type DecoderObjectKeyMap<T> = { [P in keyof T]?: string };

/**
 * Decoder for objects with specified field decoders.
 *
 * @category Data Structures
 * @param decoders Key/value pairs of decoders for each object field.
 * @param decoderName How to display the name of the object being decoded in errors.
 * @param keyMap Optional map between json field names and user land field names.
 *               Useful when the client model does not match with what the server sends.
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
 *     firstName: JsonDecoder.string,
 *     lastName: JsonDecoder.string,
 *     age: JsonDecoder.number
 *   },
 *   'User',
 *   {
 *     firstName: 'first_name',
 *     lastName: 'last_name'
 *   }
 * );
 *
 * const json = {
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   age: 30
 * };
 *
 * userDecoder.decode(json); // Ok<User>({value: {firstName: 'John', lastName: 'Doe', age: 30}})
 * ```
 */
export function object<T>(
  decoders: DecoderObject<T>,
  decoderName: string,
  // TODO: remove keyMap
  keyMap?: DecoderObjectKeyMap<T>
): Decoder<T> {
  return new Decoder<T>((json: any) => {
    if (json !== null && typeof json === 'object') {
      const result: any = {};
      for (const key in decoders) {
        if (Object.prototype.hasOwnProperty.call(decoders, key)) {
          if (keyMap && key in keyMap) {
            const jsonKey = keyMap[key] as string;
            const r = decoders[key].decode(json[jsonKey]);
            if (r.isOk()) {
              result[key] = r.value;
            } else {
              return Result.err<T>(
                $JsonDecoderErrors.objectJsonKeyError(
                  decoderName,
                  key,
                  jsonKey,
                  r.error
                )
              );
            }
          } else {
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
      }
      return Result.ok<T>(result);
    } else {
      return Result.err<T>(
        $JsonDecoderErrors.primitiveError(json, decoderName)
      );
    }
  });
}

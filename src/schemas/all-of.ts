/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { allOfError } from '../errors/all-of-error';
import * as Result from '../utils/result';

/**
 * Infers the decoder output type.
 *
 * @category Internal Types
 */
export type DecoderOutput<D> = D extends Decoder<infer T> ? T : never;

/**
 * Union to intersection inference.
 *
 * @category Internal Types
 */
export type UnionToIntersection<U> = (
  U extends any ? (x: U) => any : never
) extends (x: infer I) => any
  ? I
  : never;

/**
 * Merges allOf types into one.
 *
 * @category Internal Types
 */
export type AllOfOutput<T extends readonly Decoder<any>[]> =
  UnionToIntersection<DecoderOutput<T[number]>>;

/**
 * A decoder that succeeds only if all provided decoders succeed.
 *
 * @category Utils
 * @param decoders Array of decoders to try in sequence
 * @param decoderName How to display the name of the object being decoded in errors
 * @returns A decoder that tries each decoder in sequence until all succeed
 *
 * @example
 * ```ts
 *  type User = { firstname: string; lastname: string; role: 'admin' | 'user'; };
 *  const firstnameDecoder = JsonDecoder.object({ firstname: JsonDecoder.string() }, '{firstname: string}');
 *  const lastnameDecoder = JsonDecoder.object({ lastname: JsonDecoder.string() }, '{lastname: string}');
 *  const roleDecoder = JsonDecoder.oneOf([JsonDecoder.literal('admin'), JsonDecoder.literal('user')], 'admin | user');
 *  const userDecoder: Decoder<User> = JsonDecoder.allOf(
 *    [firstnameDecoder, lastnameDecoder, JsonDecoder.object({ role: roleDecoder }, 'role')],
 *    'User'
 *  );
 *  userDecoder.decode({ firstname: 'John', lastname: 'Doe', role: 'admin' }); // Ok<User>({value: { firstname: 'John', lastname: 'Doe', role: 'admin' }})
 *  userDecoder.decode({ firstname: 'John' }); // Err({error: '<User> allOf decoder failed at index #1 with <{lastname: string}> decoder failed at key "lastname" with error: undefined is not a valid string'})
 * ```
 */
export function allOf<T extends readonly Decoder<any>[]>(
  decoders: T,
  decoderName: string
): Decoder<AllOfOutput<T>> {
  return new Decoder((json: any) => {
    const isObj = isPlainObject(json);
    let lastJson = json;
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i].decode(lastJson);
      if (result.isOk()) {
        if (isObj) {
          lastJson = deepMerge({ target: lastJson, source: result.value });
        } else if (!Array.isArray(json)) {
          lastJson = result.value;
        }
      } else {
        return Result.err<T>(allOfError(decoderName, i, result.error));
      }
    }
    return Result.ok(lastJson);
  });
}

/**
 * Deeply merges two plain objects into one.
 * Arrays are not merged.
 *
 * @param target is the base object you are updating.
 * @param source contains new values that override or extend the target.
 *
 * @example
 * ```ts
 * const target = { a: 1, b: { x: 10, y: 20 } };
 * const source = { b: { y: 99, z: 42 }, c: 3 };
 * const result = deepMerge(target, source);
 * console.log(result);
 * // Output:
 * // { a: 1, b: { x: 10, y: 99, z: 42 }, c: 3 }
 * ```
 */
function deepMerge<
  T extends Record<string, any>,
  U extends Record<string, any>
>({ target, source }: { target: T; source: U }): T & U {
  const result: Record<string, any> = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMerge({ target: targetValue, source: sourceValue });
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result as T & U;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

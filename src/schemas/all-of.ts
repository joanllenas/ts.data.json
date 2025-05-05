/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { allOfError } from '../errors/all-of-error';
import * as Result from '../utils/result';

type DecoderOutput<D> = D extends Decoder<infer T> ? T : never;

type UnionToIntersection<U> = (U extends any ? (x: U) => any : never) extends (
  x: infer I
) => any
  ? I
  : never;

type AllOfOutput<T extends readonly Decoder<any>[]> = UnionToIntersection<
  DecoderOutput<T[number]>
>;

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
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i].decode(json);
      if (!result.isOk()) {
        return Result.err<T>(allOfError(decoderName, i, result.error));
      }
    }
    return Result.ok(json);
  });
}

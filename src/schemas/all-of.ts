/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { allOfFn } from '../internal/schemas';
import type {
  OutputOf,
  UnionToIntersectionOf,
  IntersectionOfOutputs
} from '../internal/types';

/**
 * Infers the decoder output type.
 *
 * @category Internal Types
 */
export type DecoderOutput<D> = OutputOf<D>;

/**
 * Union to intersection inference.
 *
 * @category Internal Types
 */
export type UnionToIntersection<U> = UnionToIntersectionOf<U>;

/**
 * Merges allOf types into one.
 *
 * @category Internal Types
 */
export type AllOfOutput<T extends readonly Decoder<any>[]> =
  IntersectionOfOutputs<T>;

/**
 * A decoder that succeeds only if all provided decoders succeed, deep-merging
 * their results into one value. Use it to combine several object decoders into a
 * single one — modelling intersection types (`A & B`), "extends", or mixins.
 *
 * **When to use:** `allOf` is for *combining* decoders that must all hold (an
 * intersection). For *alternatives* where only one should hold (a union), use
 * {@link oneOf} or {@link discriminatedUnion} instead.
 *
 * @category Utils
 * @param decoders Array of decoders to try in sequence
 * @returns A decoder that tries each decoder in sequence until all succeed
 *
 * @example
 * ```ts
 *  type User = { firstname: string; lastname: string; role: 'admin' | 'user'; };
 *  const firstnameDecoder = JsonDecoder.object({ firstname: JsonDecoder.string() });
 *  const lastnameDecoder = JsonDecoder.object({ lastname: JsonDecoder.string() });
 *  const roleDecoder = JsonDecoder.oneOf([JsonDecoder.literal('admin'), JsonDecoder.literal('user')]);
 *  const userDecoder: Decoder<User> = JsonDecoder.allOf(
 *    [firstnameDecoder, lastnameDecoder, JsonDecoder.object({ role: roleDecoder })]
 *  );
 *  userDecoder.decode({ firstname: 'John', lastname: 'Doe', role: 'admin' }); // Ok<User>
 *  // All failing sub-decoders are run and their issues are accumulated:
 *  userDecoder.decode({ firstname: 'John' });
 *  // Err({ issues: [
 *  //   { message: 'undefined is not a valid string', path: ['lastname'] },
 *  //   { message: 'no alternative matched (tried 2)', path: ['role'] },
 *  //   { message: 'undefined is not exactly "admin" or undefined is not exactly "user"', path: ['role'] }
 *  // ] })
 * ```
 */
export function allOf<T extends readonly Decoder<any>[]>(
  decoders: T
): Decoder<AllOfOutput<T>> {
  return new Decoder(allOfFn(decoders.map(Decoder.toDecodeFn)));
}

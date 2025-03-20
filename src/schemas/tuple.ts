/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { arrayError } from '../errors/array-error';
import { primitiveError } from '../errors/primitive-error';
import { tupleLengthMismatchError } from '../errors/tuple-length-mismatch-error';
import * as Result from '../utils/result';

/**
 * Type-level helper that extracts the type parameters from an array of decoders.
 *
 * Given an array of decoders, this type will produce a tuple type where each element
 * corresponds to the type that each decoder produces.
 *
 * @typeParam T - An array of decoders
 * @category Internal Types
 *
 * @example
 * ```typescript
 * type Point = TupleOfResults<[Decoder<number>, Decoder<number>]>; // [number, number]
 * ```
 */
export type TupleOfResults<T extends readonly [] | readonly Decoder<any>[]> = {
  [K in keyof T]: T[K] extends Decoder<infer R> ? R : never;
};

/**
 * Decoder for tuples with fixed length and types.
 *
 * @category Data Structures
 * @param decoders Array of decoders for each tuple element
 * @param decoderName How to display the name of the object being decoded in errors
 * @returns A decoder that validates and returns tuples
 *
 * @example
 * ```ts
 * const pointDecoder = JsonDecoder.tuple(
 *   [JsonDecoder.number(), JsonDecoder.number()],
 *   'Point'
 * );
 *
 * pointDecoder.decode([1, 2]); // Ok<[number, number]>
 * pointDecoder.decode([1, 2, 3]); // Err({error: '<Point> tuple decoder failed because it received a tuple of length 3 but expected 2'})
 * ```
 */
export function tuple<T extends readonly [] | readonly Decoder<any>[]>(
  decoders: T,
  decoderName: string
): Decoder<TupleOfResults<T>> {
  return new Decoder<TupleOfResults<T>>(json => {
    if (json instanceof Array) {
      const arr = [];
      if (json.length !== decoders.length) {
        return Result.err<TupleOfResults<T>>(
          tupleLengthMismatchError(decoderName, json, decoders)
        );
      }
      for (let i = 0; i < json.length; i++) {
        const result = decoders[i].decode(json[i]);
        if (result.isOk()) {
          arr.push(result.value);
        } else {
          return Result.err<TupleOfResults<T>>(
            arrayError(decoderName, i, result.error)
          );
        }
      }
      // Cast to a tuple of the right type.
      return Result.ok<TupleOfResults<T>>(arr as unknown as TupleOfResults<T>);
    } else {
      return Result.err<TupleOfResults<T>>(primitiveError(json, decoderName));
    }
  });
}

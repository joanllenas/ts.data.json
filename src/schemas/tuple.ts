/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import { $JsonDecoderErrors } from '../utils/errors';
import * as Result from '../utils/result';

type TupleOfResults<T extends readonly [] | readonly Decoder<any>[]> = {
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
 *   [JsonDecoder.number, JsonDecoder.number],
 *   'Point'
 * );
 *
 * pointDecoder.decode([1, 2]); // Ok<[number, number]>
 * pointDecoder.decode([1, 2, 3]); // Err({error: '<Point> tuple decoder failed because it received a tuple of length 3 but expected 2'})
 * ```
 */
export const tuple = <T extends readonly [] | readonly Decoder<any>[]>(
  decoders: T,
  decoderName: string
): Decoder<TupleOfResults<T>> => {
  return new Decoder<TupleOfResults<T>>(json => {
    if (json instanceof Array) {
      const arr = [];
      if (json.length !== decoders.length) {
        return Result.err<TupleOfResults<T>>(
          $JsonDecoderErrors.tupleLengthMismatchError(
            decoderName,
            json,
            decoders
          )
        );
      }
      for (let i = 0; i < json.length; i++) {
        const result = decoders[i].decode(json[i]);
        if (result.isOk()) {
          arr.push(result.value);
        } else {
          return Result.err<TupleOfResults<T>>(
            $JsonDecoderErrors.arrayError(decoderName, i, result.error)
          );
        }
      }
      // Cast to a tuple of the right type.
      return Result.ok<TupleOfResults<T>>(arr as unknown as TupleOfResults<T>);
    } else {
      return Result.err<TupleOfResults<T>>(
        $JsonDecoderErrors.primitiveError(json, 'array')
      );
    }
  });
};

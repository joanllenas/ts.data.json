/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { tupleFn } from '../internal/schemas';
import type { OutputsOf } from '../internal/types';

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
export type TupleOfResults<T extends readonly [] | readonly Decoder<any>[]> =
  OutputsOf<T>;

/**
 * Decoder for tuples with fixed length and types.
 *
 * @category Data Structures
 * @param decoders Array of decoders for each tuple element
 * @returns A decoder that validates and returns tuples
 *
 * @example
 * ```ts
 * const pointDecoder = JsonDecoder.tuple([JsonDecoder.number(), JsonDecoder.number()]);
 *
 * pointDecoder.decode([1, 2]); // Ok<[number, number]>
 * pointDecoder.decode([1, 2, 3]); // Err({ issues: [{ message: 'tuple received 3 items but expected 2', path: [] }] })
 *
 * // All element failures are collected before returning:
 * pointDecoder.decode(['a', 'b']);
 * // Err({ issues: [
 * //   { message: '"a" is not a valid number', path: [0] },
 * //   { message: '"b" is not a valid number', path: [1] }
 * // ] })
 * ```
 */
export function tuple<T extends readonly [] | readonly Decoder<any>[]>(
  decoders: T
): Decoder<TupleOfResults<T>> {
  return new Decoder<TupleOfResults<T>>(
    tupleFn(decoders.map(Decoder.toDecodeFn))
  );
}

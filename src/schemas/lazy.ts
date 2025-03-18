/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';

/**
 * Decoder for recursive data structures.
 *
 * @category Data Structures
 * @param mkDecoder A function that returns a decoder
 * @returns A decoder that can handle recursive data structures
 *
 * @example
 * ```ts
 * interface Tree {
 *   value: number;
 *   children?: Tree[];
 * }
 *
 * const treeDecoder = JsonDecoder.lazy(() =>
 *   JsonDecoder.object<Tree>(
 *     {
 *       value: JsonDecoder.number,
 *       children: JsonDecoder.optional(JsonDecoder.array(treeDecoder))
 *     },
 *     'Tree'
 *   )
 * );
 * ```
 */
export function lazy<T>(mkDecoder: () => Decoder<T>): Decoder<T> {
  return new Decoder((json: any) => mkDecoder().decode(json));
}

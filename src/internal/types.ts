/**
 * The type-level shapes shared by both entry points.
 *
 * Each shape is declared once here so the main entry and `./mini` cannot drift apart.
 * This module has no dependency on the `Decoder` class: {@link OutputOf} recovers a decoder's output type from either representation,
 * so the shapes built on it serve both entries unchanged.
 *
 * @module
 * @internal
 */

import type { Result } from '../utils/result';

/**
 * The type a decoder produces, read from either representation: the `Decoder` class used by the main entry,
 * or the plain decode function used by `./mini`.
 *
 * @internal
 */
export type OutputOf<D> = D extends { decode(json: any): Result<infer T> }
  ? T
  : D extends (json: any) => Result<infer T>
    ? T
    : never;

/**
 * Maps a tuple of decoders to a tuple of the types they produce.
 *
 * @internal
 */
export type OutputsOf<T> = { [K in keyof T]: OutputOf<T[K]> };

/**
 * Union to intersection inference.
 *
 * @internal
 */
export type UnionToIntersectionOf<U> = (
  U extends any ? (x: U) => any : never
) extends (x: infer I) => any
  ? I
  : never;

/**
 * The intersection of every decoder's output in a list.
 *
 * @internal
 */
export type IntersectionOfOutputs<T extends readonly unknown[]> =
  UnionToIntersectionOf<OutputOf<T[number]>>;

/**
 * The type an `emptyObject` decoder produces. Re-exported by both entry points,
 * so unlike the shapes above it is public API.
 *
 * @category Internal Types
 */
export type EmptyObject = Record<string, never>;

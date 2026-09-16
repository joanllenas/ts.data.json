/**
 * @module
 * @mergeModuleWith decoders
 * @category Main entry point
 */

import { Decoder } from '../core';
import { oneOfFn } from '../internal/schemas';
import type { DecoderOutput } from './all-of';

/**
 * Decoder for a union of alternatives. Tries each decoder in order and returns
 * the first success. When all of them fail, it returns a summary issue stating
 * that none matched, followed by every alternative's failure; issues that share
 * a path are collapsed into a single "X or Y" message so competing alternatives
 * don't read as conjunctive requirements.
 *
 * **When to use:** reach for `oneOf` for flat unions (primitives, literals) or
 * "try these shapes in order". For other common unions there are more precise
 * tools that produce cleaner errors:
 * - tagged object unions (a shared literal field) -> {@link discriminatedUnion}
 * - `X | null` -> {@link nullable}
 * - `X | undefined` -> {@link optional}
 *
 * @category Utils
 * @param decoders Array of decoders to try in sequence
 * @returns A decoder that tries each decoder in sequence until one succeeds
 *
 * @example
 * ```ts
 * // The output type is inferred as the union of the alternatives.
 * const stringOrNumber = JsonDecoder.oneOf([
 *   JsonDecoder.string(),
 *   JsonDecoder.number()
 * ]); // Decoder<string | number>
 *
 * // Pass an explicit type argument to state the target type instead.
 * const stringOrNumber2 = JsonDecoder.oneOf<string | number>([
 *   JsonDecoder.string(),
 *   JsonDecoder.number()
 * ]);
 *
 * stringOrNumber.decode('hello'); // Ok<string>
 * stringOrNumber.decode(42); // Ok<number>
 * stringOrNumber.decode(true);
 * // Err({ issues: [
 * //   { message: 'no alternative matched (tried 2)', path: [] },
 * //   { message: 'true is not a valid string or true is not a valid number', path: [] }
 * // ] })
 * ```
 *
 * @example
 * ```ts
 * // Every alternative's failure is reported. For `X | null`, prefer nullable(X)
 * // which delegates to X and yields just X's error.
 * const circle = JsonDecoder.object({
 *   kind: JsonDecoder.literal('circle'),
 *   radius: JsonDecoder.number()
 * });
 *
 * JsonDecoder.oneOf([circle, JsonDecoder.null()]).decode({ kind: 'circle', radius: 'big' });
 * // Err({ issues: [
 * //   { message: 'no alternative matched (tried 2)', path: [] },
 * //   { message: '{"kind":"circle","radius":"big"} is not null', path: [] },
 * //   { message: '"big" is not a valid number', path: ['radius'] }
 * // ] })
 *
 * JsonDecoder.nullable(circle).decode({ kind: 'circle', radius: 'big' });
 * // Err({ issues: [{ message: '"big" is not a valid number', path: ['radius'] }] })
 * ```
 */
export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T>;
export function oneOf<D extends readonly Decoder<any>[]>(
  decoders: D
): Decoder<DecoderOutput<D[number]>>;
export function oneOf(decoders: ReadonlyArray<Decoder<any>>): Decoder<any> {
  return new Decoder<any>(oneOfFn(decoders.map(Decoder.toDecodeFn)));
}

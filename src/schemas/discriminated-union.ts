/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder, type FromDecoder } from '../core';
import { primitiveError } from '../utils/errors';
import * as Result from '../utils/result';

/**
 * Decoder for tagged (discriminated) unions.
 *
 * Unlike {@link oneOf}, which tries every branch and reports each one's failure,
 * `discriminatedUnion` is told which field carries the tag and a map from each
 * tag value to the decoder for that variant. It reads the tag, picks the
 * matching decoder, and delegates to it — so a failure is that variant's own
 * structured error, with no noise from the other variants. When the tag itself
 * is missing or unknown, it reports exactly which values were expected.
 *
 * **When to use:** prefer `discriminatedUnion` over {@link oneOf} whenever your
 * variants are objects sharing a literal "tag" field (`kind`, `type`, `status`,
 * …). It gives precise, single-variant errors that `oneOf` cannot.
 *
 * @category Utils
 * @param discriminant The name of the field that holds the tag value.
 * @param mapping An object mapping each tag value to its variant decoder.
 * @returns A decoder for the union of the variant decoders' output types.
 *
 * @example
 * ```ts
 * type Circle = { kind: 'circle'; radius: number };
 * type Square = { kind: 'square'; side: number };
 *
 * const shapeDecoder = JsonDecoder.discriminatedUnion('kind', {
 *   circle: JsonDecoder.object<Circle>({
 *     kind: JsonDecoder.literal('circle'),
 *     radius: JsonDecoder.number()
 *   }),
 *   square: JsonDecoder.object<Square>({
 *     kind: JsonDecoder.literal('square'),
 *     side: JsonDecoder.number()
 *   })
 * });
 *
 * shapeDecoder.decode({ kind: 'circle', radius: 5 }); // Ok<Circle | Square>
 *
 * // A bad field reports only the matched variant's failure:
 * shapeDecoder.decode({ kind: 'circle', radius: 'big' });
 * // Err({ issues: [{ message: '"big" is not a valid number', path: ['radius'] }] })
 *
 * // An unknown tag reports the expected values:
 * shapeDecoder.decode({ kind: 'triangle' });
 * // Err({ issues: [{
 * //   message: '"kind" must be one of "circle", "square", but got "triangle"',
 * //   path: ['kind']
 * // }] })
 * ```
 */
export function discriminatedUnion<M extends Record<string, Decoder<any>>>(
  discriminant: string,
  mapping: M
): Decoder<FromDecoder<M[keyof M]>> {
  return new Decoder<FromDecoder<M[keyof M]>>((json: any) => {
    if (json === null || typeof json !== 'object') {
      return Result.err(primitiveError(json, 'object'));
    }
    const tag = json[discriminant];
    if (!Object.prototype.hasOwnProperty.call(mapping, tag)) {
      const expected = Object.keys(mapping)
        .map(key => JSON.stringify(key))
        .join(', ');
      return Result.err([
        {
          message: `"${discriminant}" must be one of ${expected}, but got ${JSON.stringify(tag)}`,
          path: [discriminant]
        }
      ]);
    }
    return mapping[tag].decode(json);
  });
}

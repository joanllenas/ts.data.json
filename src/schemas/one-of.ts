/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that tries multiple decoders in sequence until one succeeds.
 * When all decoders fail, returns the issues from the sub-decoder that
 * reached the deepest path before failing, as those represent the most
 * specific (most actionable) failure.
 *
 * @category Utils
 * @param decoders Array of decoders to try in sequence
 * @returns A decoder that tries each decoder in sequence until one succeeds
 *
 * @example
 * ```ts
 * const stringOrNumber = JsonDecoder.oneOf<string | number>([
 *   JsonDecoder.string(),
 *   JsonDecoder.number()
 * ]);
 *
 * stringOrNumber.decode('hello'); // Ok<string>
 * stringOrNumber.decode(42); // Ok<number>
 * stringOrNumber.decode(true); // Err({ issues: [{ message: 'true is not a valid string', path: [] }] })
 * ```
 *
 * @example
 * ```ts
 * // When one branch fails deeper, its issues win over a shallow mismatch
 * type Shape = { kind: 'circle'; radius: number } | null;
 * const shapeDecoder = JsonDecoder.oneOf<Shape>([
 *   JsonDecoder.object({ kind: JsonDecoder.literal('circle'), radius: JsonDecoder.number() }),
 *   JsonDecoder.null()
 * ]);
 *
 * // The object branch fails at path ['radius'], which is deeper than null's
 * // root-level failure, so the object branch issues are surfaced.
 * shapeDecoder.decode({ kind: 'circle', radius: 'big' });
 * // Err({ issues: [{ message: '"big" is not a valid number', path: ['radius'] }] })
 * ```
 */
export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
  return new Decoder<T>((json: any) => {
    let deepestIssues: ReadonlyArray<Result.DecodingIssue> = [];
    let deepestDepth = -1;
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i].decode(json);
      if (result.isOk()) {
        return result;
      }
      const maxDepth = result.issues.reduce(
        (max, issue) => Math.max(max, issue.path.length),
        0
      );
      if (maxDepth > deepestDepth) {
        deepestDepth = maxDepth;
        deepestIssues = result.issues;
      }
    }
    if (deepestIssues.length === 0) {
      return Result.err<T>([{
        message: `${JSON.stringify(json)} could not be decoded with any of the provided decoders`,
        path: []
      }]);
    }
    return Result.err<T>(deepestIssues);
  });
}

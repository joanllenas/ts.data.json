/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

/**
 * Decoder that tries multiple decoders in sequence until one succeeds.
 * When all decoders fail, returns a summary issue stating that none of the
 * alternatives matched, followed by the failure from the sub-decoder that
 * reached the deepest path, as that represents the most specific (most
 * actionable) failure. A deep branch (e.g. the matching member of a
 * discriminated union) wins over shallow ones; when several branches fail at
 * the same deepest depth they are competing alternatives, so issues sharing a
 * path are collapsed into a single "X or Y" message.
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
 * stringOrNumber.decode(true);
 * // Err({ issues: [
 * //   { message: 'no alternative matched (tried 2)', path: [] },
 * //   { message: 'true is not a valid string or true is not a valid number', path: [] }
 * // ] })
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
 * // root-level failure, so the object branch issues are surfaced after the summary.
 * shapeDecoder.decode({ kind: 'circle', radius: 'big' });
 * // Err({ issues: [
 * //   { message: 'no alternative matched (tried 2)', path: [] },
 * //   { message: '"big" is not a valid number', path: ['radius'] }
 * // ] })
 * ```
 */
export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
  return new Decoder<T>((json: any) => {
    let tiedBranches: ReadonlyArray<Result.DecodingIssue>[] = [];
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
        tiedBranches = [result.issues];
      } else if (maxDepth === deepestDepth) {
        // Keep every branch that failed at the same deepest depth.
        tiedBranches.push(result.issues);
      }
    }
    const summary: Result.DecodingIssue = {
      message: `no alternative matched (tried ${decoders.length})`,
      path: []
    };
    if (tiedBranches.length <= 1) {
      // 0 or 1 branch at the deepest depth: its issues belong to a single
      // branch (its own requirements, possibly at deeper paths), so surface
      // them as-is.
      return Result.err<T>([summary, ...(tiedBranches[0] ?? [])]);
    }
    // Several branches tied at the deepest depth: they are competing
    // alternatives, not conjunctive requirements. Collapse issues that share a
    // path into a single "X or Y" message so they don't read as siblings that
    // must all hold.
    return Result.err<T>([summary, ...collapseAlternatives(tiedBranches)]);
  });
}

/**
 * Collapses issues from competing branches into one issue per path, joining the
 * distinct messages at that path with " or ".
 */
function collapseAlternatives(
  branches: ReadonlyArray<ReadonlyArray<Result.DecodingIssue>>
): Result.DecodingIssue[] {
  const byPath = new Map<
    string,
    { path: ReadonlyArray<string | number>; messages: string[] }
  >();
  for (const branch of branches) {
    for (const issue of branch) {
      const key = JSON.stringify(issue.path);
      const entry = byPath.get(key);
      if (entry) {
        if (!entry.messages.includes(issue.message)) {
          entry.messages.push(issue.message);
        }
      } else {
        byPath.set(key, { path: issue.path, messages: [issue.message] });
      }
    }
  }
  return Array.from(byPath.values()).map(({ path, messages }) => ({
    message: messages.join(' or '),
    path
  }));
}

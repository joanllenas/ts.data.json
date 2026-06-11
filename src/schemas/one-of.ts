/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import * as Result from '../utils/result';

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
export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
  return new Decoder<T>((json: any) => {
    const branches: ReadonlyArray<Result.DecodingIssue>[] = [];
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i].decode(json);
      if (result.isOk()) {
        return result;
      }
      branches.push(result.issues);
    }
    // No alternative matched: report a summary followed by every alternative's
    // failure. Issues sharing a path are collapsed into a single "X or Y"
    // message so competing alternatives don't read as conjunctive requirements.
    return Result.err<T>([
      {
        message: `no alternative matched (tried ${decoders.length})`,
        path: []
      },
      ...collapseAlternatives(branches)
    ]);
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

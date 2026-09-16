/**
 * Shared decoding primitives used by both the class-based entry point (`.`) and the function-based entry point (`./mini`).
 *
 * This module has no dependency on the `Decoder` class,
 * so the `./mini` build can pull in only the pieces it needs without dragging the class (and its methods) into a consumer's bundle.
 *
 * @module
 */

import type { DecodingIssue, Result } from '../utils/result';

/**
 * The raw decoding function every schema is built from: it takes an unknown JSON value and returns a {@link Result}.
 *
 * @internal
 */
export type DecodeFn<T> = (json: any) => Result<T>;

/**
 * Renders a {@link DecodingIssue} `path` as a human-readable location string.
 *
 * Object keys are joined with dots, while array indices use bracket notation, matching the convention developers expect from JSON paths.
 *
 * @param path - The structured path from the decoded root to the failing field.
 * @returns The location string (empty for a root-level issue).
 * @category Error Handling
 *
 * @example
 * ```ts
 * formatIssuePath(['user', 'name']); // 'user.name'
 * formatIssuePath(['user', 'roles', 1]); // 'user.roles[1]'
 * formatIssuePath([0, 'email']); // '[0].email'
 * ```
 */
export function formatIssuePath(path: ReadonlyArray<string | number>): string {
  return path.reduce<string>((location, segment) => {
    if (typeof segment === 'number') {
      return `${location}[${segment}]`;
    }
    return location.length === 0 ? String(segment) : `${location}.${segment}`;
  }, '');
}

/**
 * Joins a list of issues into a single human-readable message,
 * prefixing each non-root issue with its location.
 * Used by the throwing/promise entry points
 *
 * @internal
 */
export function formatIssues(issues: ReadonlyArray<DecodingIssue>): string {
  return issues
    .map(issue =>
      issue.path.length === 0
        ? issue.message
        : `${formatIssuePath(issue.path)}: ${issue.message}`
    )
    .join('; ');
}

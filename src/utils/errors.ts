import type { DecodingIssue } from './result';

/** @internal */
export const primitiveError = (value: any, tag: string): DecodingIssue[] => [
  { message: `${JSON.stringify(value)} is not a valid ${tag}`, path: [] }
];

/** @internal */
export const prependPath = (
  issues: ReadonlyArray<DecodingIssue>,
  segment: string | number
): DecodingIssue[] =>
  issues.map(issue => ({ ...issue, path: [segment, ...issue.path] }));

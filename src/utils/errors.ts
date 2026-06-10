import type { DecodingIssue } from './result';

/** @internal */
export const primitiveError = (value: any, tag: string): DecodingIssue[] => [
  { message: `${JSON.stringify(value)} is not a valid ${tag}`, path: [] }
];

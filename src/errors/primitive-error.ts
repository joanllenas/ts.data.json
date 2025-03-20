/**
 * Creates an error message for primitive type mismatches
 * @param value The invalid value
 * @param tag The expected primitive type
 * @returns Formatted error message
 * @internal
 */
export const primitiveError = (value: any, tag: string): string =>
  `${JSON.stringify(value)} is not a valid ${tag}`;

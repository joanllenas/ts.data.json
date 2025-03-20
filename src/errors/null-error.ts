/**
 * Creates an error message for null type mismatches
 * @param json The non-null value
 * @returns Formatted error message
 * @internal
 */
export const nullError = (json: any): string =>
  `${JSON.stringify(json)} is not null`;

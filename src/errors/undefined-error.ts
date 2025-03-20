/**
 * Creates an error message for undefined type mismatches
 * @param json The non-undefined value
 * @returns Formatted error message
 * @internal
 */
export const undefinedError = (json: any): string =>
  `${JSON.stringify(json)} is not undefined`;

/**
 * Creates an error message for exact value mismatches
 * @param json The actual value
 * @param value The expected value
 * @returns Formatted error message
 * @internal
 */
export const exactlyError = (json: any, value: any): string =>
  `${JSON.stringify(json)} is not exactly ${JSON.stringify(value)}`;

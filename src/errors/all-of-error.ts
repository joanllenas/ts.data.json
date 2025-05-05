/**
 * Creates an error message for allOf decoder failures
 * @param decoderName Name of the decoder
 * @param index The decoder index that failed
 * @param error The decoder error message
 * @returns Formatted error message
 * @internal
 */
export const allOfError = (
  decoderName: string,
  index: number,
  error: string
): string =>
  `<${decoderName}> allOf decoder failed at index #${index} with "${error}"`;

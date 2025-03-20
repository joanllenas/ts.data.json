/**
 * Creates an error message for array decoder failures
 * @param decoderName Name of the decoder
 * @param index The index where decoding failed
 * @param error The specific error message
 * @returns Formatted error message
 * @internal
 */
export const arrayError = (
  decoderName: string,
  index: number,
  error: string
): string =>
  `<${decoderName}> decoder failed at index "${index}" with error: ${error}`;

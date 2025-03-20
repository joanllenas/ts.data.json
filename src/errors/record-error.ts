/**
 * Creates an error message for record decoder failures
 * @param decoderName Name of the decoder
 * @param key The key where decoding failed
 * @param error The specific error message
 * @returns Formatted error message
 * @internal
 */
export const recordError = (
  decoderName: string,
  key: string,
  error: string
): string =>
  `<${decoderName}> record decoder failed at key "${key}" with error: ${error}`;

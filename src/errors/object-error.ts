/**
 * Creates an error message for object decoder failures
 * @param decoderName Name of the decoder
 * @param key The key where decoding failed
 * @param error The specific error message
 * @returns Formatted error message
 * @internal
 */
export const objectError = (
  decoderName: string,
  key: string,
  error: string
): string =>
  `<${decoderName}> decoder failed at key "${key}" with error: ${error}`;

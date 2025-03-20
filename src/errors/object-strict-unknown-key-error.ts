/**
 * Creates an error message for unknown keys in strict object decoders
 * @param decoderName Name of the decoder
 * @param key The unknown key
 * @returns Formatted error message
 * @internal
 */
export const objectStrictUnknownKeyError = (
  decoderName: string,
  key: string
): string =>
  `Unknown key "${key}" found while processing strict <${decoderName}> decoder`;

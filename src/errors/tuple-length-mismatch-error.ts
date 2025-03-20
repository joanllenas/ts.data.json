/**
 * Creates an error message for tuple length mismatches
 * @param decoderName Name of the decoder
 * @param jsonArray The actual tuple array
 * @param decoders The array of decoders
 * @returns Formatted error message
 * @internal
 */
export const tupleLengthMismatchError = (
  decoderName: string,
  jsonArray: readonly any[],
  decoders: readonly any[]
): string =>
  `<${decoderName}> tuple decoder failed because it received a tuple of length ` +
  `${jsonArray.length}, but ${decoders.length} decoders.`;

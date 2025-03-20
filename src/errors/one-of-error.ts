/**
 * Creates an error message for oneOf decoder failures
 * @param decoderName Name of the decoder
 * @param json The value that couldn't be decoded
 * @returns Formatted error message
 * @internal
 */
export const oneOfError = (decoderName: string, json: any): string =>
  `<${decoderName}> decoder failed because ${JSON.stringify(
    json
  )} can't be decoded with any of the provided oneOf decoders`;

/**
 * Creates an error message for enum value mismatches
 * @param decoderName Name of the decoder
 * @param invalidValue The invalid enum value
 * @returns Formatted error message
 * @internal
 */
export const enumValueError = (
  decoderName: string,
  invalidValue: any
): string =>
  `<${decoderName}> decoder failed at value "${invalidValue}" which is not in the enum`;

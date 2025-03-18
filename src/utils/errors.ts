/**
 * @internal
 * Internal namespace for error message formatting.
 */
export namespace $JsonDecoderErrors {
  export const primitiveError = (value: any, tag: string): string =>
    `${JSON.stringify(value)} is not a valid ${tag}`;

  export const exactlyError = (json: any, value: any): string =>
    `${JSON.stringify(json)} is not exactly ${JSON.stringify(value)}`;

  export const undefinedError = (json: any): string =>
    `${JSON.stringify(json)} is not undefined`;

  export const nullError = (json: any): string =>
    `${JSON.stringify(json)} is not null`;

  export const recordError = (
    decoderName: string,
    key: string,
    error: string
  ): string =>
    `<${decoderName}> record decoder failed at key "${key}" with error: ${error}`;

  export const oneOfError = (decoderName: string, json: any): string =>
    `<${decoderName}> decoder failed because ${JSON.stringify(
      json
    )} can't be decoded with any of the provided oneOf decoders`;

  export const enumValueError = (
    decoderName: string,
    invalidValue: any
  ): string =>
    `<${decoderName}> decoder failed at value "${invalidValue}" which is not in the enum`;

  export const objectError = (
    decoderName: string,
    key: string,
    error: string
  ): string =>
    `<${decoderName}> decoder failed at key "${key}" with error: ${error}`;

  export const arrayError = (
    decoderName: string,
    index: number,
    error: string
  ): string =>
    `<${decoderName}> decoder failed at index "${index}" with error: ${error}`;

  export const objectJsonKeyError = (
    decoderName: string,
    key: string,
    jsonKey: string,
    error: string
  ): string =>
    `<${decoderName}> decoder failed at key "${key}" (mapped from the JSON key "${jsonKey}") with error: ${error}`;

  export const objectStrictUnknownKeyError = (
    decoderName: string,
    key: string
  ): string =>
    `Unknown key "${key}" found while processing strict <${decoderName}> decoder`;

  export const tupleLengthMismatchError = (
    decoderName: string,
    jsonArray: readonly any[],
    decoders: readonly any[]
  ): string =>
    `<${decoderName}> tuple decoder failed because it received a tuple of length ` +
    `${jsonArray.length}, but ${decoders.length} decoders.`;
}

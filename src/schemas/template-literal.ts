/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { exactlyError } from '../errors/exactly-error';
import * as Result from '../utils/result';

/**
 * Decoder that validates a template literal.
 *
 * @category Utils
 * @param parts Any number of string literals (e.g. "hello") and string or number decoders (e.g. JsonDecoder.string()).
 * @returns A decoder that only accepts the specified value
 *
 * @example
 * ```ts
 * const pxDecoder = JsonDecoder.templateLiteral([JsonDecoder.number(), "px"]);
 *
 * pxDecoder.decode("99px"); // Ok<"99px">({value: "99px"})
 * pxDecoder.decode(2); // Err({error: '2 is not exactly "?px"'})
 * ```
 */
export function templateLiteral<const T extends string>(
  parts: readonly (string | number | Decoder<any>)[]
): Decoder<T> {
  return new Decoder((json: any) => {
    if (typeof json !== 'string') {
      const template = parts
        .map(p => (p instanceof Decoder ? '?' : p))
        .join('');
      return Result.err(exactlyError(json, template));
    }

    let index = 0;
    let jsonIndex = 0;

    for (const part of parts) {
      if (part instanceof Decoder) {
        // Find the next literal part to know where this value ends
        const nextLiteralIndex = parts.findIndex(
          (p, i) => i > index && typeof p === 'string'
        );
        const endIndex =
          nextLiteralIndex === -1
            ? json.length
            : json.indexOf(parts[nextLiteralIndex] as string, jsonIndex);

        if (endIndex === -1) {
          const template = parts
            .map(p => (p instanceof Decoder ? '?' : p))
            .join('');
          return Result.err(exactlyError(json, template));
        }

        const value = json.substring(jsonIndex, endIndex);
        let result = part.decode(value);
        if (!result.isOk()) {
          // Try again. It might be a number() decoder
          result = part.decode(parseInt(value));
        }
        if (!result.isOk()) {
          return result;
        }
        jsonIndex = endIndex;
      } else {
        // String or number literal
        const literal = String(part);
        if (!json.startsWith(literal, jsonIndex)) {
          const template = parts
            .map(p => (p instanceof Decoder ? '?' : p))
            .join('');
          return Result.err(exactlyError(json, template));
        }
        jsonIndex += literal.length;
      }
      index++;
    }

    if (jsonIndex !== json.length) {
      const template = parts
        .map(p => (p instanceof Decoder ? '?' : p))
        .join('');
      return Result.err(exactlyError(json, template));
    }

    return Result.ok(json as T);
  });
}

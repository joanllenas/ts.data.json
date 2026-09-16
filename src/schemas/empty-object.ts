/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { emptyObjectFn } from '../internal/schemas';
import type { EmptyObject } from '../internal/types';

/**
 * Represents an empty object.
 *
 * @category Internal Types
 */
export type { EmptyObject } from '../internal/types';

/**
 * Decoder for an empty object ({}).
 *
 * @category Data Structures
 * @returns A decoder that validates and returns empty objects
 *
 * @example
 * ```ts
 * JsonDecoder.emptyObject().decode({}); // Ok<EmptyObject>({value: {}})
 * JsonDecoder.emptyObject().decode({a: 1}); // Err({ issues: [{ message: '{"a":1} is not a valid empty object', path: [] }] })
 * ```
 */
export function emptyObject(): Decoder<EmptyObject> {
  return new Decoder<EmptyObject>(emptyObjectFn());
}

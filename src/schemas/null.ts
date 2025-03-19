/**
 * @module
 * @mergeModuleWith decoders
 * @category Api docs
 */

import { Decoder } from '../core';
import { $JsonDecoderErrors } from '../utils/errors';
import * as Result from '../utils/result';

/**
 * TODO: docs
 * @category Primitives
 */
function null_(): Decoder<null> {
  return new Decoder((json: any) => {
    if (json === null) {
      return Result.ok<null>(null);
    } else {
      return Result.err<null>($JsonDecoderErrors.nullError(json));
    }
  });
}

export { null_ as null };

/**
 * @module
 * @mergeModuleWith json-decoder
 * @category Api docs
 */

import { Decoder } from '../core';
import { $JsonDecoderErrors } from '../utils/errors';
import * as Result from '../utils/result';

/**
 * TODO: docs
 * @category Primitives
 */
function undefined_(): Decoder<undefined> {
  return new Decoder((json: any) => {
    if (json === undefined) {
      return Result.ok<undefined>(undefined);
    } else {
      return Result.err<undefined>($JsonDecoderErrors.undefinedError(json));
    }
  });
}

export { undefined_ as undefined };

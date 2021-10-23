import { Result, ok, err } from './result';

export type FromDecoder<Decoder> = Decoder extends JsonDecoder.Decoder<infer T>
  ? T
  : never;

export namespace JsonDecoder {
  export class Decoder<a> {
    constructor(private decodeFn: (json: any) => Result<a>) {}

    /**
     * Decodes a JSON object of type <a> and returns a Result<a>
     * @param json The JSON object
     */
    decode(json: any): Result<a> {
      return this.decodeFn(json);
    }

    /**
     * Decodes a JSON object of type <a> and calls onOk() on success or onErr() on failure, both return <b>
     *
     * @param onOk function called when the decoder succeeds
     * @param onErr function called when the decoder fails
     * @param json The JSON object to decode
     */
    fold<b>(onOk: (result: a) => b, onErr: (error: string) => b, json: any): b {
      const result = this.decode(json);
      if (result.isOk()) {
        return onOk(result.value);
      } else {
        return onErr(result.error);
      }
    }

    /**
     * Decodes a JSON object of type <a> and returns a Promise<a>
     * @param json The JSON object to decode
     */
    decodeToPromise(json: any): Promise<a> {
      return new Promise((resolve, reject) => {
        const result = this.decode(json);
        if (result.isOk()) {
          return resolve(result.value);
        } else {
          return reject(result.error);
        }
      });
    }

    /**
     * If the decoder has succeeded, transforms the decoded value into something else
     * @param fn The transformation function
     */
    map<b>(fn: (value: a) => b): Decoder<b> {
      return new Decoder<b>((json: any) => {
        const result = this.decodeFn(json);
        if (result.isOk()) {
          return ok(fn(result.value));
        } else {
          return err(result.error);
        }
      });
    }

    /**
     * TODO: Add documentation in the readme
     * If the decoder has failed, transforms the error into an Ok value
     * @param fn The transformation function
     */
    mapError<b>(fn: (error: string) => b): Decoder<a | b> {
      return new Decoder<a | b>((json: any) => {
        const result = this.decodeFn(json);
        if (result.isOk()) {
          return ok<a>(result.value);
        } else {
          return ok<b>(fn(result.error));
        }
      });
    }

    /**
     * Chains decoders
     * @param fn Function that returns a new decoder
     */
    chain<b>(fn: (value: a) => Decoder<b>): Decoder<b> {
      return new Decoder<b>((json: any) => {
        const result = this.decodeFn(json);
        if (result.isOk()) {
          return fn(result.value).decode(json);
        } else {
          return err(result.error);
        }
      });
    }
  }

  /**
   * Decoder for recursive data structures.
   *
   * @param mkDecoder A function that returns a decoder
   */
  export function lazy<a>(mkDecoder: () => Decoder<a>): Decoder<a> {
    return new Decoder((json: any) => mkDecoder().decode(json));
  }

  /**
   * Decoder for `string`.
   */
  export const string: Decoder<string> = new Decoder<string>((json: any) => {
    if (typeof json === 'string') {
      return ok<string>(json);
    } else {
      return err<string>($JsonDecoderErrors.primitiveError(json, 'string'));
    }
  });

  /**
   * Decoder for `number`.
   */
  export const number: Decoder<number> = new Decoder<number>((json: any) => {
    if (typeof json === 'number') {
      return ok<number>(json);
    } else {
      return err<number>($JsonDecoderErrors.primitiveError(json, 'number'));
    }
  });

  /**
   * Decoder for `boolean`.
   */
  export const boolean: Decoder<boolean> = new Decoder<boolean>((json: any) => {
    if (typeof json === 'boolean') {
      return ok<boolean>(json);
    } else {
      return err<boolean>($JsonDecoderErrors.primitiveError(json, 'boolean'));
    }
  });

  /**
   * Decode for `enumeration`.
   *
   * @param enumObj The enum object to use for decoding. Must not be a const enum.
   * @param decoderName How to display the name of the object being decoded in errors.
   */
  export function enumeration<e>(
    enumObj: object,
    decoderName: string
  ): Decoder<e> {
    return new Decoder<e>((json: any) => {
      const enumValue = Object.values(enumObj).find((x: any) => x === json);
      if (enumValue) {
        return ok<e>(enumValue);
      }
      return err<e>($JsonDecoderErrors.enumValueError(decoderName, json));
    });
  }

  export type DecoderObject<a> = { [p in keyof Required<a>]: Decoder<a[p]> };
  export type DecoderObjectKeyMap<a> = { [p in keyof a]?: string };

  /**
   * Decoder for objects.
   *
   * @param decoders Key/value pairs of decoders for each object field.
   * @param decoderName How to display the name of the object being decoded in errors.
   * @param keyMap Optional map between json field names and user land field names.
   *               Useful when the client model does not match with what the server sends.
   */
  export function object<a>(
    decoders: DecoderObject<a>,
    decoderName: string,
    keyMap?: DecoderObjectKeyMap<a>
  ): Decoder<a> {
    return new Decoder<a>((json: any) => {
      if (json !== null && typeof json === 'object') {
        const result: any = {};
        for (const key in decoders) {
          if (decoders.hasOwnProperty(key)) {
            if (keyMap && key in keyMap) {
              const jsonKey = keyMap[key] as string;
              const r = decoders[key].decode(json[jsonKey]);
              if (r.isOk()) {
                result[key] = r.value;
              } else {
                return err<a>(
                  $JsonDecoderErrors.objectJsonKeyError(
                    decoderName,
                    key,
                    jsonKey,
                    r.error
                  )
                );
              }
            } else {
              const r = decoders[key].decode(json[key]);
              if (r.isOk()) {
                result[key] = r.value;
              } else {
                return err<a>(
                  $JsonDecoderErrors.objectError(decoderName, key, r.error)
                );
              }
            }
          }
        }
        return ok<a>(result);
      } else {
        return err<a>($JsonDecoderErrors.primitiveError(json, decoderName));
      }
    });
  }

  /**
   * Decoder for objects that performs strict key checks.
   * The decoder will fail if there are any extra keys in the provided object.
   *
   * @param decoders Key/value pairs of decoders for each object field.
   * @param decoderName How to display the name of the object being decoded in errors.
   */
  export function objectStrict<a>(
    decoders: DecoderObject<a>,
    decoderName: string
  ): Decoder<a> {
    return new Decoder<a>((json: any) => {
      if (json !== null && typeof json === 'object') {
        for (const key in json) {
          if (!decoders.hasOwnProperty(key)) {
            return err<a>(
              $JsonDecoderErrors.objectStrictUnknownKeyError(decoderName, key)
            );
          }
        }
        const result: any = {};
        for (const key in decoders) {
          if (decoders.hasOwnProperty(key)) {
            const r = decoders[key].decode(json[key]);
            if (r.isOk()) {
              result[key] = r.value;
            } else {
              return err<a>(
                $JsonDecoderErrors.objectError(decoderName, key, r.error)
              );
            }
          }
        }
        return ok<a>(result);
      } else {
        return err<a>($JsonDecoderErrors.primitiveError(json, decoderName));
      }
    });
  }

  /**
   * Always succeeding decoder
   */
  export const succeed: Decoder<any> = new Decoder<any>((json: any) => {
    return ok<any>(json);
  });

  /**
   * Always failing decoder
   */
  export function fail<a>(error: string): Decoder<a> {
    return new Decoder<a>((json: any) => {
      return err<any>(error);
    });
  }

  /**
   * Tries to decode with `decoder` and returns `defaultValue` on failure.
   *
   * @param defaultValue The default value returned in case of decoding failure.
   * @param decoder The actual decoder to use.
   */
  export function failover<a>(
    defaultValue: a,
    decoder: Decoder<a>
  ): Decoder<a> {
    return new Decoder<a>((json: any) => {
      const result = decoder.decode(json);
      if (result.isOk()) {
        return result;
      } else {
        return ok<a>(defaultValue);
      }
    });
  }

  /**
   * Tries to decode with `decoder` and returns `error` on failure, but allows
   * for `undefined` or `null` values to be present at the top level and returns
   * an `undefined` if the value was `undefined` or `null`.
   *
   * @param decoder The actual decoder to use.
   */
  export function optional<a>(decoder: Decoder<a>): Decoder<a | undefined> {
    return new Decoder<a | undefined>((json: any) => {
      if (json === undefined) {
        return ok<undefined>(undefined);
      } else if (json === null) {
        return ok<undefined>(undefined);
      } else {
        return decoder.decode(json);
      }
    });
  }

  /**
   * Tries to decode with `decoder` and returns `error` on failure, but allows for `null` value.
   *
   * @param decoder The actual decoder to use
   */
  export function nullable<a>(decoder: Decoder<a>): Decoder<a | null> {
    return new Decoder<a | null>((json: any) => {
      if (json === null) {
        return ok(null);
      }
      return decoder.decode(json);
    });
  }

  /**
   * Tries to decode the provided json value with any of the provided `decoders`.
   * If all provided `decoders` fail, this decoder fails.
   * Otherwise, it returns the first successful decoder.
   *
   * @param decoders An array of decoders to try.
   */
  export function oneOf<a>(
    decoders: Array<Decoder<a>>,
    decoderName: string
  ): Decoder<a> {
    return new Decoder<a>((json: any) => {
      for (let i = 0; i < decoders.length; i++) {
        const result = decoders[i].decode(json);
        if (result.isOk()) {
          return result;
        }
      }
      return err<a>($JsonDecoderErrors.oneOfError(decoderName, json));
    });
  }

  /**
   * Tries to decode the provided json value with all of the provided `decoders`.
   * The order of the provided decoders matters: the output of one decoder is passed
   * as input to the next decoder. If any of the provided `decoders` fail, this
   * decoder fails. Otherwise, it returns the output of the last decoder.
   *
   * @param decoders a spread of decoders to use.
   */
  export function allOf<T extends Array<Decoder<unknown>>, R>(
    ...decoders: [...T, Decoder<R>]
  ): Decoder<R> {
    return new Decoder<R>((json: any) =>
      decoders.reduce(
        (prev, curr) =>
          (prev.isOk() ? curr.decode(prev.value) : prev) as Result<R>,
        ok<R>(json)
      )
    );
  }

  /**
   * Decoder for key/value pairs.
   *
   * @param decoder An object decoder for the values. All values must have the same shape or use oneOf otherwise.
   */
  export const dictionary = <a>(
    decoder: Decoder<a>,
    decoderName: string
  ): Decoder<{ [name: string]: a }> => {
    return new Decoder<{ [name: string]: a }>(json => {
      if (json !== null && typeof json === 'object') {
        const obj: { [name: string]: a } = {};
        for (const key in json) {
          if (json.hasOwnProperty(key)) {
            const result = decoder.decode(json[key]);
            if (result.isOk()) {
              obj[key] = result.value;
            } else {
              return err<{ [name: string]: a }>(
                $JsonDecoderErrors.dictionaryError(
                  decoderName,
                  key,
                  result.error
                )
              );
            }
          }
        }
        return ok<{ [name: string]: a }>(obj);
      } else {
        return err<{ [name: string]: a }>(
          $JsonDecoderErrors.primitiveError(json, 'dictionary')
        );
      }
    });
  };

  /**
   * Decoder for Array<T>.
   *
   * @param decoder The decoder for the array element.
   */
  export const array = <a>(
    decoder: Decoder<a>,
    decoderName: string
  ): Decoder<Array<a>> => {
    return new Decoder<Array<a>>(json => {
      if (json instanceof Array) {
        const arr: Array<a> = [];
        for (let i = 0; i < json.length; i++) {
          const result = decoder.decode(json[i]);
          if (result.isOk()) {
            arr.push(result.value);
          } else {
            return err<Array<a>>(
              $JsonDecoderErrors.arrayError(decoderName, i, result.error)
            );
          }
        }
        return ok<Array<a>>(arr);
      } else {
        return err<Array<a>>($JsonDecoderErrors.primitiveError(json, 'array'));
      }
    });
  };

  /**
   * Decoder for a tuple of a specific shape.
   *
   * @param decoders The decoders for each element of the tuple.
   */
  // This turns a tuple of decoders into a tuple of their results.
  type TupleOfResults<T extends readonly [] | readonly Decoder<any>[]> = {
    [K in keyof T]: T[K] extends Decoder<infer R> ? R : never;
  };
  export const tuple = <T extends readonly [] | readonly Decoder<any>[]>(
    decoders: T,
    decoderName: string
  ): Decoder<TupleOfResults<T>> => {
    return new Decoder<TupleOfResults<T>>(json => {
      if (json instanceof Array) {
        const arr = [];
        if (json.length !== decoders.length) {
          return err<TupleOfResults<T>>(
            $JsonDecoderErrors.tupleLengthMismatchError(
              decoderName,
              json,
              decoders
            )
          );
        }
        for (let i = 0; i < json.length; i++) {
          const result = decoders[i].decode(json[i]);
          if (result.isOk()) {
            arr.push(result.value);
          } else {
            return err<TupleOfResults<T>>(
              $JsonDecoderErrors.arrayError(decoderName, i, result.error)
            );
          }
        }
        // Cast to a tuple of the right type.
        return ok<TupleOfResults<T>>(arr as unknown as TupleOfResults<T>);
      } else {
        return err<TupleOfResults<T>>(
          $JsonDecoderErrors.primitiveError(json, 'array')
        );
      }
    });
  };

  /**
   * Decoder that only succeeds when json is strictly (===) `null`.
   * When succeeds it returns `defaultValue`.
   *
   * @param defaultValue The value returned when json is `null`.
   */
  export function isNull<a>(defaultValue: a): Decoder<a> {
    return new Decoder((json: any) => {
      if (json === null) {
        return ok<a>(defaultValue);
      } else {
        return err<a>($JsonDecoderErrors.nullError(json));
      }
    });
  }

  /**
   * Decoder that only succeeds when json is strictly (===) `undefined`.
   * When succeeds it returns `defaultValue`.
   *
   * @param defaultValue The value returned when json is `undefined`.
   */
  export function isUndefined<a>(defaultValue: a): Decoder<a> {
    return new Decoder((json: any) => {
      if (json === undefined) {
        return ok<a>(defaultValue);
      } else {
        return err<a>($JsonDecoderErrors.undefinedError(json));
      }
    });
  }

  /**
   * Decoder that always succeeds returning `value`.
   *
   * @param value The value returned.
   */
  export const constant = <a>(value: a): Decoder<a> => {
    return new Decoder<a>((json: any) => ok(value));
  };

  /**
   * Decoder that only succeeds when json is strictly (===) `value`.
   * When succeeds it returns `value`.
   *
   * @param value The value returned on success.
   */
  export function isExactly<a>(value: a): Decoder<a> {
    return new Decoder((json: any) => {
      if (json === value) {
        return ok<a>(value);
      } else {
        return err<a>($JsonDecoderErrors.exactlyError(json, value));
      }
    });
  }

  /**
   * Transforms union type to intersection type.
   *
   * For example:
   *
   *    Intersect<{ x: number } | { y: number }>
   *
   * becomes
   *
   *    { x: number } & { y: number }
   */
  type Intersect<T> = (T extends any ? (x: T) => void : never) extends (
    x: infer R
  ) => void
    ? R
    : never;

  /**
   * Transforms array of objects to a combined intersection type
   *
   * For example:
   *
   *    Combine<[{ x: number }, { y: number }]>
   *
   * becomes
   *
   *    { x: number } & { y: number }
   */
  type Combine<T extends { [k: string]: any }[]> = Intersect<T[number]>;

  /**
   * Combines a list of decoders into a single decoder
   * which result is an intersection type of input decoders.
   *
   * Example:
   *
   *    > JsonDecoder.combine(Decoder<User>, Decoder<Metadata>)
   *    // => Decoder<User & Metadata>
   *
   * @param decoders Variable arguments list of decoders
   */
  export function combine<TS extends { [k: string]: any }[]>(
    ...decoders: { [T in keyof TS]: Decoder<TS[T]> }
  ): Decoder<Combine<TS>> {
    return new Decoder((json: any) => {
      try {
        const finalResult = decoders.reduce((acc, decoder) => {
          const result = decoder.decode(json);
          if (result.isOk()) {
            return {
              ...acc,
              ...result.value
            };
          }
          throw result.error;
        }, {}) as Combine<TS>;
        return ok(finalResult);
      } catch (error) {
        return err(error as string);
      }
    });
  }
}

export namespace $JsonDecoderErrors {
  export const primitiveError = (value: any, tag: string): string =>
    `${JSON.stringify(value)} is not a valid ${tag}`;

  export const exactlyError = (json: any, value: any): string =>
    `${JSON.stringify(json)} is not exactly ${JSON.stringify(value)}`;

  export const undefinedError = (json: any): string =>
    `${JSON.stringify(json)} is not undefined`;

  export const nullError = (json: any): string =>
    `${JSON.stringify(json)} is not null`;

  export const dictionaryError = (
    decoderName: string,
    key: string,
    error: string
  ): string =>
    `<${decoderName}> dictionary decoder failed at key "${key}" with error: ${error}`;

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

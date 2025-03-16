/**
 * This module contains the JsonDecoder type, which is a type-safe way to handle JSON decoding.
 * @module json-decoder
 * @category Api docs
 */

import type { StandardSchemaV1 } from './standard-schema-v1';
import { Result, err, ok } from './result';

/**
 * Extracts the type parameter T from a JsonDecoder.Decoder<T>.
 *
 * This utility type is useful when you want to get the type that a decoder will produce,
 * without having to manually specify it.
 *
 * @example
 * ```typescript
 * const userDecoder = JsonDecoder.object({
 *   id: JsonDecoder.number,
 *   name: JsonDecoder.string
 * }, 'User');
 *
 * // You can extract the type from the decoder:
 * type User = FromDecoder<typeof userDecoder>;
 * ```
 *
 * @typeParam Decoder - A JsonDecoder.Decoder type
 */
export type FromDecoder<Decoder> =
  Decoder extends JsonDecoder.Decoder<infer T> ? T : never;

/**
 * TypeScript type annotations provide compile-time guarantees. However, when data flows into our clients from external sources, many things can go wrong at runtime.
 *
 * JSON decoders validate our JSON before it enters our program. This way, if the data has an unexpected structure, we're immediately alerted.
 *
 * @example
 * ```ts
 * type User = {
 *   firstname: string;
 *   lastname: string;
 * };
 *
 * const userDecoder = JsonDecoder.object<User>(
 *   {
 *     firstname: JsonDecoder.string,
 *     lastname: JsonDecoder.string
 *   },
 *   'User'
 * );
 *
 * const jsonObjectOk = {
 *   firstname: 'Damien',
 *   lastname: 'Jurado'
 * };
 *
 * userDecoder
 *   .decodeToPromise(jsonObjectOk)
 *   .then(user => {
 *     console.log(`User ${user.firstname} ${user.lastname} decoded successfully`);
 *   })
 *   .catch(error => {
 *     console.log(error);
 *   });
 * ```
 */
export namespace JsonDecoder {
  /**
   * A decoder that can validate and transform JSON data into strongly typed TypeScript values.
   *
   * @template T - The type that this decoder will produce when successful
   * @category Types
   */
  export class Decoder<T> implements StandardSchemaV1<unknown, T> {
    /**
     * Creates a new decoder that can validate and transform JSON data into strongly typed TypeScript values.
     *
     * @param decodeFn - A function that takes a JSON object and returns a Result<T>
     * @category Constructor
     *
     * @example
     * ```ts
     * const myStringDecoder: JsonDecoder.Decoder<string> = new JsonDecoder.Decoder(
     *   (json: unknown) => {
     *     if (typeof json === 'string') {
     *       return ok(json);
     *     } else {
     *       return err('Expected a string');
     *     }
     *   }
     * );
     * ```
     */
    constructor(private decodeFn: (json: any) => Result<T>) {}

    /**
     * Decodes a JSON object of type <T> and returns a Result<T>
     * @param json The JSON object to decode
     * @returns A Result containing either the decoded value or an error message
     * @category Entry Point
     *
     * @example
     * ```ts
     * JsonDecoder.string.decode('hi'); // Ok<string>({value: 'hi'})
     * JsonDecoder.string.decode(5); // Err({error: '5 is not a valid string'})
     * ```
     */
    decode(json: any): Result<T> {
      return this.decodeFn(json);
    }

    /**
     * The Standard Schema interface for this decoder.
     * @link https://standardschema.org/
     * @category Entry Point
     */
    '~standard': StandardSchemaV1.Props<unknown, T> = {
      version: 1 as const,
      vendor: 'ts.data.json',
      validate: (value: unknown): StandardSchemaV1.Result<T> => {
        const result = this.decode(value);
        if (result.isOk()) {
          return { value: result.value };
        } else {
          return { issues: [{ message: result.error }] };
        }
      }
    };

    /**
     * Decodes a JSON object of type <T> and calls onOk() on success or onErr() on failure, both return <O>
     *
     * @param onOk function called when the decoder succeeds
     * @param onErr function called when the decoder fails
     * @param json The JSON object to decode
     * @returns The result of either onOk or onErr
     * @category Entry Point
     *
     * @example
     * ```ts
     * JsonDecoder.string.fold(
     *   (value: string) => parseInt(value, 10),
     *   (error: string) => 0,
     *   '000000000001'
     * ); // 1
     * ```
     */
    fold<O>(onOk: (result: T) => O, onErr: (error: string) => O, json: any): O {
      const result = this.decode(json);
      if (result.isOk()) {
        return onOk(result.value);
      } else {
        return onErr(result.error);
      }
    }

    /**
     * Decodes a JSON object of type <T> and returns a Promise<T>
     * @param json The JSON object to decode
     * @returns A Promise that resolves with the decoded value or rejects with an error message
     * @category Entry Point
     *
     * @example
     * ```ts
     * JsonDecoder.string.decodeToPromise('hola').then(res => console.log(res)); // 'hola'
     * JsonDecoder.string.decodeToPromise(2).catch(err => console.log(err)); // '2 is not a valid string'
     * ```
     */
    decodeToPromise(json: any): Promise<T> {
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
     * @returns A new decoder that applies the transformation
     * @category Transformation
     *
     * @example
     * ```ts
     * // Decode a string, then transform it into a Date
     * const dateDecoder = JsonDecoder.string.map(stringDate => new Date(stringDate));
     * // Ok scenario
     * dateDecoder.decode('2018-12-21T18:22:25.490Z'); // Ok<Date>({value: Date(......)})
     * // Err scenario
     * dateDecoder.decode(false); // Err({error: 'false is not a valid string'})
     * ```
     */
    map<O>(fn: (value: T) => O): Decoder<O> {
      return new Decoder<O>((json: any) => {
        const result = this.decodeFn(json);
        if (result.isOk()) {
          return ok(fn(result.value));
        } else {
          return err(result.error);
        }
      });
    }

    /**
     * If the decoder has failed, transforms the error into an Ok value
     * @param fn The transformation function
     * @returns A new decoder that applies the transformation
     * @category Transformation
     * @ignore
     * ```
     */
    mapError<O>(fn: (error: string) => O): Decoder<T | O> {
      return new Decoder<T | O>((json: any) => {
        const result = this.decodeFn(json);
        if (result.isOk()) {
          return ok<T>(result.value);
        } else {
          return ok<O>(fn(result.error));
        }
      });
    }

    /**
     * Chain decoders that might fail
     * @param fn Function that returns a new decoder
     * @returns A new decoder that chains the current decoder with the result of fn
     * @category Transformation
     *
     * @example
     * ```ts
     * const adultDecoder = JsonDecoder.number.chain(age =>
     *   age >= 18
     *     ? JsonDecoder.succeed
     *     : JsonDecoder.fail(`Age ${age} is less than 18`)
     * );
     * adultDecoder.decode(18); // Ok<number>({value: 18})
     * adultDecoder.decode(17); // Err({error: 'Age 17 is less than 18'})
     * ```
     */
    chain<O>(fn: (value: T) => Decoder<O>): Decoder<O> {
      return new Decoder<O>((json: any) => {
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
   * @category Data Structures
   * @param mkDecoder A function that returns a decoder
   * @returns A decoder that can handle recursive data structures
   *
   * @example
   * ```ts
   * interface Tree {
   *   value: number;
   *   children?: Tree[];
   * }
   *
   * const treeDecoder = JsonDecoder.lazy(() =>
   *   JsonDecoder.object<Tree>(
   *     {
   *       value: JsonDecoder.number,
   *       children: JsonDecoder.optional(JsonDecoder.array(treeDecoder))
   *     },
   *     'Tree'
   *   )
   * );
   * ```
   */
  export function lazy<T>(mkDecoder: () => Decoder<T>): Decoder<T> {
    return new Decoder((json: any) => mkDecoder().decode(json));
  }

  /**
   * Decoder for `string` values.
   *
   * @category Primitives
   * @returns A decoder that validates and returns string values
   *
   * @example
   * ```ts
   * JsonDecoder.string.decode('hi'); // Ok<string>({value: 'hi'})
   * JsonDecoder.string.decode(5); // Err({error: '5 is not a valid string'})
   * ```
   */
  export const string: Decoder<string> = new Decoder<string>((json: any) => {
    if (typeof json === 'string') {
      return ok<string>(json);
    } else {
      return err<string>($JsonDecoderErrors.primitiveError(json, 'string'));
    }
  });

  /**
   * Decoder for `number` values.
   *
   * @category Primitives
   * @returns A decoder that validates and returns number values
   *
   * @example
   * ```ts
   * JsonDecoder.number.decode(99); // Ok<number>({value: 99})
   * JsonDecoder.number.decode('hola'); // Err({error: 'hola is not a valid number'})
   * ```
   */
  export const number: Decoder<number> = new Decoder<number>((json: any) => {
    if (typeof json === 'number') {
      return ok<number>(json);
    } else {
      return err<number>($JsonDecoderErrors.primitiveError(json, 'number'));
    }
  });

  /**
   * Decoder for `boolean` values.
   *
   * @category Primitives
   * @returns A decoder that validates and returns boolean values
   *
   * @example
   * ```ts
   * JsonDecoder.boolean.decode(true); // Ok<boolean>({value: true})
   * JsonDecoder.boolean.decode('true'); // Err({error: 'true is not a valid boolean'})
   * ```
   */
  export const boolean: Decoder<boolean> = new Decoder<boolean>((json: any) => {
    if (typeof json === 'boolean') {
      return ok<boolean>(json);
    } else {
      return err<boolean>($JsonDecoderErrors.primitiveError(json, 'boolean'));
    }
  });

  type EmptyObject = Record<string, never>;
  /**
   * Decoder for an empty object ({}).
   *
   * @category Data Structures
   * @returns A decoder that validates and returns empty objects
   *
   * @example
   * ```ts
   * JsonDecoder.emptyObject.decode({}); // Ok<EmptyObject>({value: {}})
   * JsonDecoder.emptyObject.decode({a: 1}); // Err({error: '{a: 1} is not a valid empty object'})
   * ```
   */
  export const emptyObject: Decoder<EmptyObject> = new Decoder<EmptyObject>(
    (json: any) => {
      if (
        json !== null &&
        typeof json === 'object' &&
        Object.keys(json).length === 0
      ) {
        return ok<EmptyObject>(json);
      } else {
        return err<EmptyObject>(
          $JsonDecoderErrors.primitiveError(json, 'empty object')
        );
      }
    }
  );

  /**
   * Decoder for `enumeration` values.
   *
   * @category Data Structures
   * @param enumObj The enum object to use for decoding. Must not be a const enum.
   * @param decoderName How to display the name of the object being decoded in errors.
   * @returns A decoder that validates and returns enum values
   *
   * @example
   * ```ts
   * enum Color {
   *   Red = 'red',
   *   Blue = 'blue'
   * }
   *
   * const colorDecoder = JsonDecoder.enumeration(Color, 'Color');
   * colorDecoder.decode('red'); // Ok<Color>({value: Color.Red})
   * colorDecoder.decode('green'); // Err({error: '<Color> decoder failed at value "green" which is not in the enum'})
   * ```
   */
  export function enumeration<E>(
    enumObj: object,
    decoderName: string
  ): Decoder<E> {
    return new Decoder<E>((json: any) => {
      const enumValue = Object.values(enumObj).find((x: any) => x === json);
      if (enumValue !== undefined) {
        return ok<E>(enumValue);
      }
      return err<E>($JsonDecoderErrors.enumValueError(decoderName, json));
    });
  }

  /**
   * @category Types
   */
  export type DecoderObject<T> = { [P in keyof Required<T>]: Decoder<T[P]> };

  /**
   * @category Types
   */
  export type DecoderObjectKeyMap<T> = { [P in keyof T]?: string };

  /**
   * Decoder for objects with specified field decoders.
   *
   * @category Data Structures
   * @param decoders Key/value pairs of decoders for each object field.
   * @param decoderName How to display the name of the object being decoded in errors.
   * @param keyMap Optional map between json field names and user land field names.
   *               Useful when the client model does not match with what the server sends.
   * @returns A decoder that validates and returns objects matching the specified structure
   *
   * @example
   * ```ts
   * interface User {
   *   firstName: string;
   *   lastName: string;
   *   age: number;
   * }
   *
   * const userDecoder = JsonDecoder.object<User>(
   *   {
   *     firstName: JsonDecoder.string,
   *     lastName: JsonDecoder.string,
   *     age: JsonDecoder.number
   *   },
   *   'User',
   *   {
   *     firstName: 'first_name',
   *     lastName: 'last_name'
   *   }
   * );
   *
   * const json = {
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   age: 30
   * };
   *
   * userDecoder.decode(json); // Ok<User>({value: {firstName: 'John', lastName: 'Doe', age: 30}})
   * ```
   */
  export function object<T>(
    decoders: DecoderObject<T>,
    decoderName: string,
    keyMap?: DecoderObjectKeyMap<T>
  ): Decoder<T> {
    return new Decoder<T>((json: any) => {
      if (json !== null && typeof json === 'object') {
        const result: any = {};
        for (const key in decoders) {
          if (Object.prototype.hasOwnProperty.call(decoders, key)) {
            if (keyMap && key in keyMap) {
              const jsonKey = keyMap[key] as string;
              const r = decoders[key].decode(json[jsonKey]);
              if (r.isOk()) {
                result[key] = r.value;
              } else {
                return err<T>(
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
                return err<T>(
                  $JsonDecoderErrors.objectError(decoderName, key, r.error)
                );
              }
            }
          }
        }
        return ok<T>(result);
      } else {
        return err<T>($JsonDecoderErrors.primitiveError(json, decoderName));
      }
    });
  }

  /**
   * Decoder for objects with specified field decoders that fails if unknown fields are present.
   *
   * @category Data Structures
   * @param decoders Key/value pairs of decoders for each object field.
   * @param decoderName How to display the name of the object being decoded in errors.
   * @returns A decoder that validates and returns objects matching the specified structure, failing if unknown fields are present
   *
   * @example
   * ```ts
   * interface User {
   *   name: string;
   *   age: number;
   * }
   *
   * const userDecoder = JsonDecoder.objectStrict<User>(
   *   {
   *     name: JsonDecoder.string,
   *     age: JsonDecoder.number
   *   },
   *   'User'
   * );
   *
   * userDecoder.decode({name: 'John', age: 30}); // Ok<User>
   * userDecoder.decode({name: 'John', age: 30, extra: 'field'}); // Err({error: 'Unknown key "extra" found while processing strict <User> decoder'})
   * ```
   */
  export function objectStrict<T>(
    decoders: DecoderObject<T>,
    decoderName: string
  ): Decoder<T> {
    return new Decoder<T>((json: any) => {
      if (json !== null && typeof json === 'object') {
        for (const key in json) {
          if (!Object.prototype.hasOwnProperty.call(decoders, key)) {
            return err<T>(
              $JsonDecoderErrors.objectStrictUnknownKeyError(decoderName, key)
            );
          }
        }
        const result: any = {};
        for (const key in decoders) {
          if (Object.prototype.hasOwnProperty.call(decoders, key)) {
            const r = decoders[key].decode(json[key]);
            if (r.isOk()) {
              result[key] = r.value;
            } else {
              return err<T>(
                $JsonDecoderErrors.objectError(decoderName, key, r.error)
              );
            }
          }
        }
        return ok<T>(result);
      } else {
        return err<T>($JsonDecoderErrors.primitiveError(json, decoderName));
      }
    });
  }

  /**
   * Decoder that always succeeds with the given value.
   *
   * @category Utils
   * @returns A decoder that always succeeds
   *
   * @example
   * ```ts
   * const succeedDecoder = JsonDecoder.succeed;
   * succeedDecoder.decode('anything'); // Ok<any>({value: 'anything'})
   * ```
   */
  export const succeed: Decoder<any> = new Decoder<any>((json: any) => {
    return ok<any>(json);
  });

  /**
   * Decoder that always fails with the given error message.
   *
   * @category Utils
   * @param error The error message to return
   * @returns A decoder that always fails with the specified error
   *
   * @example
   * ```ts
   * const failDecoder = JsonDecoder.fail<string>('This decoder always fails');
   * failDecoder.decode('anything'); // Err({error: 'This decoder always fails'})
   * ```
   */
  export function fail<T>(error: string): Decoder<T> {
    return new Decoder<T>(() => {
      return err<any>(error);
    });
  }

  /**
   * Decoder that falls back to a default value if the given decoder fails.
   *
   * @category Transformations
   * @param defaultValue The value to return if the decoder fails
   * @param decoder The decoder to try first
   * @returns A decoder that returns the default value if the given decoder fails
   *
   * @example
   * ```ts
   * const numberOrZero = JsonDecoder.failover(0, JsonDecoder.number);
   * numberOrZero.decode(42); // Ok<number>({value: 42})
   * numberOrZero.decode('not a number'); // Ok<number>({value: 0})
   * ```
   */
  export function failover<T>(
    defaultValue: T,
    decoder: Decoder<T>
  ): Decoder<T> {
    return new Decoder<T>((json: any) => {
      const result = decoder.decode(json);
      if (result.isOk()) {
        return result;
      } else {
        return ok<T>(defaultValue);
      }
    });
  }

  /**
   * Decoder that makes a field optional.
   *
   * @category Utils
   * @param decoder The decoder for the field when it is present
   * @returns A decoder that accepts either the decoded value or undefined
   *
   * @example
   * ```ts
   * interface User {
   *   name: string;
   *   age?: number;
   * }
   *
   * const userDecoder = JsonDecoder.object<User>(
   *   {
   *     name: JsonDecoder.string,
   *     age: JsonDecoder.optional(JsonDecoder.number)
   *   },
   *   'User'
   * );
   *
   * userDecoder.decode({name: 'John'}); // Ok<User>
   * userDecoder.decode({name: 'John', age: 30}); // Ok<User>
   * ```
   */
  export function optional<T>(decoder: Decoder<T>): Decoder<T | undefined> {
    return new Decoder<T | undefined>((json: any) => {
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
   * Decoder that accepts null values.
   *
   * @category Utils
   * @param decoder The decoder for the non-null value
   * @returns A decoder that accepts either the decoded value or null
   *
   * @example
   * ```ts
   * interface User {
   *   name: string;
   *   age: number | null;
   * }
   *
   * const userDecoder = JsonDecoder.object<User>(
   *   {
   *     name: JsonDecoder.string,
   *     age: JsonDecoder.nullable(JsonDecoder.number)
   *   },
   *   'User'
   * );
   *
   * userDecoder.decode({name: 'John', age: null}); // Ok<User>
   * userDecoder.decode({name: 'John', age: 30}); // Ok<User>
   * ```
   */
  export function nullable<T>(decoder: Decoder<T>): Decoder<T | null> {
    return new Decoder<T | null>((json: any) => {
      if (json === null) {
        return ok(null);
      }
      return decoder.decode(json);
    });
  }

  /**
   * Decoder that tries multiple decoders in sequence until one succeeds.
   *
   * @category Utils
   * @param decoders Array of decoders to try in sequence
   * @param decoderName How to display the name of the object being decoded in errors
   * @returns A decoder that tries each decoder in sequence until one succeeds
   *
   * @example
   * ```ts
   * const stringOrNumber = JsonDecoder.oneOf<string | number>(
   *   [JsonDecoder.string, JsonDecoder.number],
   *   'StringOrNumber'
   * );
   *
   * stringOrNumber.decode('hello'); // Ok<string>({value: 'hello'})
   * stringOrNumber.decode(42); // Ok<number>({value: 42})
   * stringOrNumber.decode(true); // Err({error: '<StringOrNumber> decoder failed because true is not a valid value'})
   * ```
   */
  export function oneOf<T>(
    decoders: Array<Decoder<T>>,
    decoderName: string
  ): Decoder<T> {
    return new Decoder<T>((json: any) => {
      for (let i = 0; i < decoders.length; i++) {
        const result = decoders[i].decode(json);
        if (result.isOk()) {
          return result;
        }
      }
      return err<T>($JsonDecoderErrors.oneOfError(decoderName, json));
    });
  }

  /**
   * Decoder that combines multiple decoders into a single decoder.
   *
   * @category Combinators
   * @param decoders Array of decoders to combine
   * @returns A decoder that combines the results of multiple decoders
   *
   * @internal
   * @deprecated This decoder will be removed in the next major version.
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
   * Decoder for dictionary/record types with string keys.
   *
   * @category Data Structures
   * @param decoder The decoder for the dictionary values
   * @param decoderName How to display the name of the object being decoded in errors
   * @returns A decoder that validates and returns a dictionary with string keys
   *
   * @example
   * ```ts
   * const numberDict = JsonDecoder.dictionary(JsonDecoder.number, 'NumberDict');
   *
   * numberDict.decode({a: 1, b: 2}); // Ok<Record<string, number>>
   * numberDict.decode({a: '1', b: 2}); // Err({error: '<NumberDict> dictionary decoder failed at key "a" with error: "1" is not a valid number'})
   * ```
   */
  export const dictionary = <V>(
    decoder: Decoder<V>,
    decoderName: string
  ): Decoder<{ [K: string]: V }> => {
    return new Decoder<{ [K: string]: V }>(json => {
      if (json !== null && typeof json === 'object') {
        const obj: { [K: string]: V } = {};
        for (const key in json) {
          if (Object.prototype.hasOwnProperty.call(json, key)) {
            const result = decoder.decode(json[key]);
            if (result.isOk()) {
              obj[key] = result.value;
            } else {
              return err<{ [K: string]: V }>(
                $JsonDecoderErrors.dictionaryError(
                  decoderName,
                  key,
                  result.error
                )
              );
            }
          }
        }
        return ok<{ [K: string]: V }>(obj);
      } else {
        return err<{ [K: string]: V }>(
          $JsonDecoderErrors.primitiveError(json, 'dictionary')
        );
      }
    });
  };

  /**
   * Decoder for arrays.
   *
   * @category Data Structures
   * @param decoder The decoder for array elements
   * @param decoderName How to display the name of the object being decoded in errors
   * @returns A decoder that validates and returns arrays
   *
   * @example
   * ```ts
   * const numberArray = JsonDecoder.array(JsonDecoder.number, 'NumberArray');
   *
   * numberArray.decode([1, 2, 3]); // Ok<number[]>
   * numberArray.decode([1, '2', 3]); // Err({error: '<NumberArray> decoder failed at index "1" with error: "2" is not a valid number'})
   * ```
   */
  export const array = <T>(
    decoder: Decoder<T>,
    decoderName: string
  ): Decoder<Array<T>> => {
    return new Decoder<Array<T>>(json => {
      if (json instanceof Array) {
        const arr: Array<T> = [];
        for (let i = 0; i < json.length; i++) {
          const result = decoder.decode(json[i]);
          if (result.isOk()) {
            arr.push(result.value);
          } else {
            return err<Array<T>>(
              $JsonDecoderErrors.arrayError(decoderName, i, result.error)
            );
          }
        }
        return ok<Array<T>>(arr);
      } else {
        return err<Array<T>>($JsonDecoderErrors.primitiveError(json, 'array'));
      }
    });
  };

  /**
   * @category Types
   */
  type TupleOfResults<T extends readonly [] | readonly Decoder<any>[]> = {
    [K in keyof T]: T[K] extends Decoder<infer R> ? R : never;
  };

  /**
   * Decoder for tuples with fixed length and types.
   *
   * @category Data Structures
   * @param decoders Array of decoders for each tuple element
   * @param decoderName How to display the name of the object being decoded in errors
   * @returns A decoder that validates and returns tuples
   *
   * @example
   * ```ts
   * const pointDecoder = JsonDecoder.tuple(
   *   [JsonDecoder.number, JsonDecoder.number],
   *   'Point'
   * );
   *
   * pointDecoder.decode([1, 2]); // Ok<[number, number]>
   * pointDecoder.decode([1, 2, 3]); // Err({error: '<Point> tuple decoder failed because it received a tuple of length 3 but expected 2'})
   * ```
   */
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
   * Decoder that accepts null values and returns a default value.
   *
   * @category Transformations
   * @param defaultValue The value to return when null is encountered
   * @returns A decoder that accepts null and returns the default value
   *
   * @example
   * ```ts
   * const numberOrZero = JsonDecoder.isNull(0);
   *
   * numberOrZero.decode(null); // Ok<number>({value: 0})
   * numberOrZero.decode(42); // Err({error: '42 is not null'})
   * ```
   */
  export function isNull<T>(defaultValue: T): Decoder<T> {
    return new Decoder((json: any) => {
      if (json === null) {
        return ok<T>(defaultValue);
      } else {
        return err<T>($JsonDecoderErrors.nullError(json));
      }
    });
  }

  /**
   * Decoder that accepts undefined values and returns a default value.
   *
   * @category Transformations
   * @param defaultValue The value to return when undefined is encountered
   * @returns A decoder that accepts undefined and returns the default value
   *
   * @example
   * ```ts
   * const numberOrZero = JsonDecoder.isUndefined(0);
   *
   * numberOrZero.decode(undefined); // Ok<number>({value: 0})
   * numberOrZero.decode(42); // Err({error: '42 is not undefined'})
   * ```
   */
  export function isUndefined<T>(defaultValue: T): Decoder<T> {
    return new Decoder((json: any) => {
      if (json === undefined) {
        return ok<T>(defaultValue);
      } else {
        return err<T>($JsonDecoderErrors.undefinedError(json));
      }
    });
  }

  /**
   * Decoder that only accepts a specific constant value.
   *
   * @category Utils
   * @param value The constant value to accept
   * @returns A decoder that only accepts the specified value
   *
   * @example
   * ```ts
   * const trueDecoder = JsonDecoder.constant(true);
   *
   * trueDecoder.decode(true); // Ok<boolean>({value: true})
   * trueDecoder.decode(false); // Err({error: 'false is not exactly true'})
   * ```
   */
  export const constant = <T>(value: T): Decoder<T> => {
    return new Decoder<T>(() => ok(value));
  };

  /**
   * Decoder that only accepts a specific value.
   *
   * @category Utils
   * @param value The exact value to accept
   * @returns A decoder that only accepts the specified value
   *
   * @example
   * ```ts
   * const oneDecoder = JsonDecoder.isExactly(1);
   *
   * oneDecoder.decode(1); // Ok<number>({value: 1})
   * oneDecoder.decode(2); // Err({error: '2 is not exactly 1'})
   * ```
   */
  export function isExactly<T>(value: T): Decoder<T> {
    return new Decoder((json: any) => {
      if (json === value) {
        return ok<T>(value);
      } else {
        return err<T>($JsonDecoderErrors.exactlyError(json, value));
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
   * Combines multiple decoders into a single decoder that merges their results.
   *
   * @category Combinators
   * @param decoders Array of decoders to combine
   * @returns A decoder that combines the results of multiple decoders
   *
   * @internal
   * @deprecated This decoder will be removed in the next major version.
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

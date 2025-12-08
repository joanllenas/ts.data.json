/**
 * This module contains the Decoder type, which is a type-safe way to handle JSON decoding.
 * @module core
 * @category Api docs
 */

import * as Result from './utils/result';
import type { StandardSchemaV1 } from './utils/standard-schema-v1';

/**
 * Extracts the type parameter T from a JsonDecoder.Decoder<T>.
 *
 * This utility type is useful when you want to get the type that a decoder will produce,
 * without having to manually specify it.
 *
 * @example
 * ```typescript
 * const userDecoder = JsonDecoder.object({
 *   id: JsonDecoder.number(),
 *   name: JsonDecoder.string()
 * }, 'User');
 *
 * // You can extract the type from the decoder:
 * type User = JsonDecoder.FromDecoder<typeof userDecoder>;
 * ```
 *
 * @typeParam D - A JsonDecoder.Decoder type
 */
export type FromDecoder<D> = D extends Decoder<infer T> ? T : never;

/**
 * A decoder that can validate and transform JSON data into strongly typed TypeScript values.
 *
 * @example
 * Let's replicate the string decoder:
 * ```ts
 * const myStringDecoder = (): JsonDecoder.Decoder<string> => new JsonDecoder.Decoder(
 *   (json: unknown) => {
 *     if (typeof json === 'string') {
 *       return JsonDecoder.ok(json);
 *     } else {
 *       return JsonDecoder.err('Expected a string');
 *     }
 *   }
 * );
 * myStringDecoder().decode('hello'); // Ok<string>({value: 'hello'})
 * myStringDecoder().decode(123); // Err({error: 'Expected a string'})
 * ```
 *
 * @template T - The type that this decoder will produce when successful
 */
export class Decoder<T> implements StandardSchemaV1<unknown, T> {
  /**
   * Creates a new decoder that can validate and transform JSON data into strongly typed TypeScript values.
   *
   * @param decodeFn - A function that takes a JSON object and returns a Result<T>
   * @category Constructor
   */
  constructor(private decodeFn: (json: any) => Result.Result<T>) {}

  /**
   * Parses a JSON object of type <T> and returns the decoded value or throws an error
   * @param json The JSON object to decode
   * @returns The decoded value of type T
   * @throws {string} Throws the error message if decoding fails
   * @category Entry Point
   *
   * @example
   * ```ts
   * JsonDecoder.string().parse('hello'); // 'hello'
   * JsonDecoder.string().parse(123); // throws '123 is not a valid string'
   * ```
   */
  parse(json: any): T {
    const result = this.decode(json);
    if (result.isOk()) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  /**
   * Decodes a JSON object of type <T> and returns a Result<T>
   * @param json The JSON object to decode
   * @returns A Result containing either the decoded value or an error message
   * @category Entry Point
   *
   * @example
   * ```ts
   * JsonDecoder.string().decode('hi'); // Ok<string>({value: 'hi'})
   * JsonDecoder.string().decode(5); // Err({error: '5 is not a valid string'})
   * ```
   */
  decode(json: any): Result.Result<T> {
    return this.decodeFn(json);
  }

  /**
   * The Standard Schema interface for this decoder.
   * @see [Standard Schema](https://standardschema.dev)
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
   * Decodes a JSON object of type <T> and returns a Promise<T>
   * @param json The JSON object to decode
   * @returns A Promise that resolves with the decoded value or rejects with an error message
   * @category Entry Point
   *
   * @example
   * ```ts
   * JsonDecoder.string().decodePromise('hola').then(res => console.log(res)); // 'hola'
   * JsonDecoder.string().decodePromise(2).catch(err => console.log(err)); // '2 is not a valid string'
   * ```
   */
  decodePromise(json: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const result = this.decode(json);
      if (result.isOk()) {
        return resolve(result.value);
      } else {
        return reject(result.error);
      }
    });
  }

  /* v8 ignore start */
  /**
   * Alias for decodePromise
   * @deprecated Use decodePromise instead
   * @ignore
   */
  decodeToPromise = this.decodePromise;
  /* v8 ignore stop */

  /**
   * If the decoder has succeeded, transforms the decoded value into something else
   * @param fn The transformation function
   * @returns A new decoder that applies the transformation
   * @category Transformation
   *
   * @example
   * ```ts
   * // Decode a string, then transform it into a Date
   * const dateDecoder = JsonDecoder.string().map(stringDate => new Date(stringDate));
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
        return Result.ok(fn(result.value));
      } else {
        return Result.err(result.error);
      }
    });
  }

  /**
   * Chain together a sequence of decoders that may fail.
   * @param fn Function that returns a new decoder
   * @returns A new decoder that chains the current decoder with the result of fn
   * @category Transformation
   *
   * @example
   * ```ts
   * const adultDecoder = JsonDecoder.number().flatMap(age =>
   *   age >= 18
   *     ? JsonDecoder.succeed()
   *     : JsonDecoder.fail(`Age ${age} is less than 18`)
   * );
   * adultDecoder.decode(18); // Ok<number>({value: 18})
   * adultDecoder.decode(17); // Err({error: 'Age 17 is less than 18'})
   * ```
   */
  flatMap<O>(fn: (value: T) => Decoder<O>): Decoder<O> {
    return new Decoder<O>((json: any) => {
      const result = this.decodeFn(json);
      if (result.isOk()) {
        return fn(result.value).decode(json);
      } else {
        return Result.err(result.error);
      }
    });
  }

  /* v8 ignore start */
  /**
   * Alias for flatMap
   * @deprecated Use flatMap instead
   * @ignore
   */
  chain = this.flatMap;
  /* v8 ignore stop */
}

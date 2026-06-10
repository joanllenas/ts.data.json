/**
 * This module contains the Result type, which is a type-safe way to handle success and error cases.
 *
 * @module result
 * @category Api docs
 */

/**
 * A single decoding failure with a human-readable message and the path from
 * the root of the decoded value to the field that failed.
 *
 * @example
 * ```typescript
 * // A failure at users[2].name would look like:
 * const issue: DecodingIssue = { message: '"null" is not a valid string', path: ['users', 2, 'name'] };
 * ```
 */
export interface DecodingIssue {
  readonly message: string;
  /**
   * Path segments from the decoded root to the failing field.
   * An empty array means the failure is at the root level.
   */
  readonly path: ReadonlyArray<string | number>;
}

/**
 * A type-safe way to handle success and error cases.
 * The Result type is used throughout the library to handle decoding results.
 *
 * @typeParam T - The type of the successful value
 */
export class Ok<T> {
  /**
   * Creates a new Ok instance containing a successful value.
   * @param value - The successful value
   */
  constructor(readonly value: T) {}

  /**
   * Transforms the successful value using the provided function.
   * If this is an Ok, applies the function to the value and wraps the result in a new Ok.
   *
   * @typeParam O - The type of the transformed value
   * @param fn - The function to transform the value
   * @returns A new Result containing the transformed value
   *
   * @example
   * ```typescript
   * const result: Result<number> = ok(5);
   * const doubled: Result<number> = result.map(x => x * 2);
   * // doubled = Ok(10)
   * ```
   */
  map<O>(fn: (value: T) => O): Result<O> {
    return ok(fn(this.value));
  }

  /**
   * Type guard to check if this Result is an Ok.
   * Always returns true for Ok instances.
   *
   * @returns true for Ok instances
   *
   * @example
   * ```typescript
   * const result: Result<number> = ok(5);
   * if (result.isOk()) {
   *   // TypeScript knows result.value exists here
   *   console.log(result.value);
   * }
   * ```
   */
  isOk(): this is Ok<T> {
    return true;
  }
}

/**
 * Represents a failed operation with one or more structured issues.
 *
 * @typeParam T - The type that would have been returned if successful
 */
export class Err<T> {
  /**
   * Creates a new Err instance from structured decoding issues.
   * @param issues - The list of issues describing what went wrong and where.
   */
  constructor(readonly issues: ReadonlyArray<DecodingIssue>) {}

  /**
   * Returns a new Err with the same issues but a different type parameter.
   * Since this represents an error, the transform function is never called.
   *
   * @typeParam O - The new type parameter
   * @param _fn - The function that would have transformed the value (ignored)
   * @returns A new Err with the same issues
   *
   * @example
   * ```typescript
   * const result: Result<number> = err("Invalid input");
   * const mapped: Result<string> = result.map(x => x.toString());
   * // mapped = Err([{ message: "Invalid input", path: [] }])
   * ```
   */
  map<O>(_fn: (value: T) => O): Result<O> {
    return new Err<O>(this.issues);
  }

  /**
   * Type guard to check if this Result is an Ok.
   * Always returns false for Err instances.
   *
   * @returns false for Err instances
   *
   * @example
   * ```typescript
   * const result: Result<number> = err([{ message: "Invalid input", path: [] }]);
   * if (!result.isOk()) {
   *   // TypeScript knows result.issues exists here
   *   console.log(result.issues);
   * }
   * ```
   */
  isOk(): this is Ok<T> {
    return false;
  }
}

/**
 * A union type representing either a successful value (Ok) or an error (Err).
 * This is used throughout the library to handle operations that might fail.
 *
 * @typeParam T - The type of the successful value
 */
export type Result<T> = Ok<T> | Err<T>;

/**
 * Creates a new Ok instance representing a successful value.
 *
 * @typeParam T - The type of the value
 * @param value - The successful value to wrap
 * @returns A Result containing the successful value
 *
 * @example
 * ```typescript
 * const result = JsonDecoder.ok(42);
 * // result = Ok(42)
 * ```
 */
export function ok<T>(value: T): Result<T> {
  return new Ok(value);
}

/**
 * Creates a new Err instance representing a failed operation.
 *
 * @typeParam T - The type that would have been returned if successful
 * @param issues - One or more structured issues describing what went wrong and where.
 *
 * @example
 * ```typescript
 * const result = JsonDecoder.err<number>([{ message: "Invalid number", path: ["age"] }]);
 * // result.issues === [{ message: "Invalid number", path: ["age"] }]
 * ```
 */
export function err<T>(issues: ReadonlyArray<DecodingIssue>): Result<T> {
  return new Err<T>(issues);
}

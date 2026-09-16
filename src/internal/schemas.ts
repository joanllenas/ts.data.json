/**
 * The decoding logic for every schema, expressed as plain {@link DecodeFn} factories with no dependency on the `Decoder` class.
 *
 * Both entry points build on these:
 * - the main entry (`src/schemas/*`) adapts its `Decoder` arguments with `Decoder.toDecodeFn` and wraps the result in a new `Decoder`,
 * - the `./mini` entry (`src/mini.ts`) exposes them directly.
 *
 * Every factory takes and returns plain functions.
 * Keeping the class out of this module is what lets a consumer of `./mini` tree-shake away everything they do not use, down to a small fixed core.
 *
 * @module
 * @internal
 */

import { ok, err, type DecodingIssue } from '../utils/result';
import type { DecodeFn } from './runtime';
import { primitiveError, prependPath } from '../utils/errors';
import type { EmptyObject } from './types';

export type { EmptyObject } from './types';

// ---------------------------------------------------------------------------
// Object field specs
// ---------------------------------------------------------------------------

/**
 * A single field spec for object-like decoders: either a decoder for the same-named JSON key,
 * or a `{ fromKey, decoder }` pair reading a different key.
 * @internal
 */
export type FieldSpec<D> = D | { fromKey: string; decoder: D };

/**
 * One object field, resolved to the JSON key to read and the function to read it with.
 * @internal
 */
export type ObjectField = {
  key: string;
  sourceKey: string;
  decode: DecodeFn<unknown>;
};

/**
 * True for a `{ fromKey, decoder }` pair. `fromKey` is the discriminant of the {@link FieldSpec} union,
 * and neither decoder representation carries it: a `./mini` decoder is a function, and a `Decoder` instance has no such property
 */
function isFromKeyPair<D>(
  spec: FieldSpec<D>
): spec is { fromKey: string; decoder: D } {
  return typeof spec === 'object' && spec !== null && 'fromKey' in spec;
}

/**
 * Resolves a record of field specs into a flat list, once, at decoder construction time.
 * `toFn` adapts one decoder of the caller's representation into a {@link DecodeFn}.
 *
 * @internal
 */
export function normalizeFields<D>(
  specs: Record<string, FieldSpec<D>>,
  toFn: (decoder: D) => DecodeFn<unknown>
): ObjectField[] {
  const fields: ObjectField[] = [];
  for (const key in specs) {
    if (Object.prototype.hasOwnProperty.call(specs, key)) {
      const spec = specs[key];
      if (isFromKeyPair(spec)) {
        fields.push({
          key,
          sourceKey: spec.fromKey,
          decode: toFn(spec.decoder)
        });
      } else {
        fields.push({ key, sourceKey: key, decode: toFn(spec) });
      }
    }
  }
  return fields;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** @internal */
export function stringFn(): DecodeFn<string> {
  return (json: any) =>
    typeof json === 'string' ? ok(json) : err(primitiveError(json, 'string'));
}

/** @internal */
export function numberFn(): DecodeFn<number> {
  return (json: any) =>
    typeof json === 'number' ? ok(json) : err(primitiveError(json, 'number'));
}

/** @internal */
export function booleanFn(): DecodeFn<boolean> {
  return (json: any) =>
    typeof json === 'boolean' ? ok(json) : err(primitiveError(json, 'boolean'));
}

/** @internal */
export function nullFn(): DecodeFn<null> {
  return (json: any) =>
    json === null
      ? ok(null)
      : err([{ message: `${JSON.stringify(json)} is not null`, path: [] }]);
}

/** @internal */
export function undefinedFn(): DecodeFn<undefined> {
  return (json: any) =>
    json === undefined
      ? ok(undefined)
      : err([
          { message: `${JSON.stringify(json)} is not undefined`, path: [] }
        ]);
}

/** @internal */
export function constantFn<T>(value: T): DecodeFn<T> {
  return () => ok(value);
}

/** @internal */
export function succeedFn(): DecodeFn<any> {
  return (json: any) => ok(json);
}

/** @internal */
export function failFn<T>(error: string): DecodeFn<T> {
  return () => err<T>([{ message: error, path: [] }]);
}

/** @internal */
export function literalFn<const T>(value: T): DecodeFn<T> {
  return (json: any) =>
    json === value
      ? ok<T>(value)
      : err<T>([
          {
            message: `${JSON.stringify(json)} is not exactly ${JSON.stringify(value)}`,
            path: []
          }
        ]);
}

/** @internal */
export function enumerationFn<E>(enumObj: object): DecodeFn<E> {
  return (json: any) => {
    const enumValue = Object.values(enumObj).find((x: any) => x === json);
    if (enumValue !== undefined) {
      return ok<E>(enumValue);
    }
    return err<E>(primitiveError(json, 'enum value'));
  };
}

/** @internal */
export function emptyObjectFn(): DecodeFn<EmptyObject> {
  return (json: any) =>
    json !== null && typeof json === 'object' && Object.keys(json).length === 0
      ? ok<EmptyObject>(json)
      : err<EmptyObject>(primitiveError(json, 'empty object'));
}

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

/** @internal */
export function arrayFn<T>(decode: DecodeFn<T>): DecodeFn<Array<T>> {
  return (json: any) => {
    if (json instanceof Array) {
      const arr: Array<T> = [];
      const allIssues: DecodingIssue[] = [];
      for (let i = 0; i < json.length; i++) {
        const result = decode(json[i]);
        if (result.isOk()) {
          arr.push(result.value);
        } else {
          allIssues.push(...prependPath(result.issues, i));
        }
      }
      if (allIssues.length > 0) {
        return err<Array<T>>(allIssues);
      }
      return ok<Array<T>>(arr);
    } else {
      return err<Array<T>>(primitiveError(json, 'array'));
    }
  };
}

/** @internal */
export function tupleFn(decoders: ReadonlyArray<DecodeFn<any>>): DecodeFn<any> {
  return (json: any) => {
    if (json instanceof Array) {
      if (json.length !== decoders.length) {
        return err([
          {
            message: `tuple received ${json.length} items but expected ${decoders.length}`,
            path: []
          }
        ]);
      }
      const arr: any[] = [];
      const allIssues: DecodingIssue[] = [];
      for (let i = 0; i < json.length; i++) {
        const result = decoders[i](json[i]);
        if (result.isOk()) {
          arr.push(result.value);
        } else {
          allIssues.push(...prependPath(result.issues, i));
        }
      }
      if (allIssues.length > 0) {
        return err(allIssues);
      }
      return ok(arr);
    } else {
      return err(primitiveError(json, 'tuple'));
    }
  };
}

/** @internal */
export function objectFn<T>(fields: ReadonlyArray<ObjectField>): DecodeFn<T> {
  return (json: any) => {
    if (json !== null && typeof json === 'object') {
      const result: any = {};
      const allIssues: DecodingIssue[] = [];
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const r = field.decode(json[field.sourceKey]);
        if (r.isOk()) {
          result[field.key] = r.value;
        } else {
          allIssues.push(...prependPath(r.issues, field.key));
        }
      }
      if (allIssues.length > 0) {
        return err<T>(allIssues);
      }
      return ok<T>(result);
    } else {
      return err<T>(primitiveError(json, 'object'));
    }
  };
}

/** @internal */
export function objectStrictFn<T>(
  fields: ReadonlyArray<ObjectField>
): DecodeFn<T> {
  // The allowed JSON key for a field is its `fromKey` when it has one, and the TypeScript property name otherwise.
  // Both are already resolved in `sourceKey`, so the set is built once here rather than on every decode
  const allowedKeys = new Set<string>(fields.map(field => field.sourceKey));
  return (json: any) => {
    if (json !== null && typeof json === 'object') {
      const allIssues: DecodingIssue[] = [];
      for (const key in json) {
        if (!allowedKeys.has(key)) {
          allIssues.push({
            message: `Unknown key "${key}" found in strict object`,
            path: []
          });
        }
      }
      const result: any = {};
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const r = field.decode(json[field.sourceKey]);
        if (r.isOk()) {
          result[field.key] = r.value;
        } else {
          allIssues.push(...prependPath(r.issues, field.key));
        }
      }
      if (allIssues.length > 0) {
        return err<T>(allIssues);
      }
      return ok<T>(result);
    } else {
      return err<T>(primitiveError(json, 'object'));
    }
  };
}

/** @internal */
export function recordFn<V>(decode: DecodeFn<V>): DecodeFn<{ [K: string]: V }> {
  return (json: any) => {
    if (json !== null && typeof json === 'object') {
      const obj: { [K: string]: V } = {};
      const allIssues: DecodingIssue[] = [];
      for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
          const result = decode(json[key]);
          if (result.isOk()) {
            obj[key] = result.value;
          } else {
            allIssues.push(...prependPath(result.issues, key));
          }
        }
      }
      if (allIssues.length > 0) {
        return err<{ [K: string]: V }>(allIssues);
      }
      return ok<{ [K: string]: V }>(obj);
    } else {
      return err<{ [K: string]: V }>(primitiveError(json, 'object'));
    }
  };
}

// ---------------------------------------------------------------------------
// Combinators
// ---------------------------------------------------------------------------

/** @internal */
export function optionalFn<T>(decode: DecodeFn<T>): DecodeFn<T | undefined> {
  return (json: any) =>
    json === undefined ? ok<undefined>(undefined) : decode(json);
}

/** @internal */
export function nullableFn<T>(decode: DecodeFn<T>): DecodeFn<T | null> {
  return (json: any) => (json === null ? ok<T | null>(null) : decode(json));
}

/** @internal */
export function fallbackFn<T>(
  defaultValue: T,
  decode: DecodeFn<T>
): DecodeFn<T> {
  return (json: any) => {
    const result = decode(json);
    return result.isOk() ? result : ok<T>(defaultValue);
  };
}

/** @internal */
export function lazyFn<T>(mkDecode: () => DecodeFn<T>): DecodeFn<T> {
  return (json: any) => mkDecode()(json);
}

/** @internal */
export function oneOfFn<T>(decoders: ReadonlyArray<DecodeFn<T>>): DecodeFn<T> {
  return (json: any) => {
    const branches: ReadonlyArray<DecodingIssue>[] = [];
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i](json);
      if (result.isOk()) {
        return result;
      }
      branches.push(result.issues);
    }
    // No alternative matched: report a summary followed by every alternative's failure.
    // Issues sharing a path are collapsed into a single "X or Y" message so competing alternatives don't read as conjunctive requirements
    return err<T>([
      {
        message: `no alternative matched (tried ${decoders.length})`,
        path: []
      },
      ...collapseAlternatives(branches)
    ]);
  };
}

/**
 * Collapses issues from competing branches into one issue per path, joining the distinct messages at that path with " or "
 */
function collapseAlternatives(
  branches: ReadonlyArray<ReadonlyArray<DecodingIssue>>
): DecodingIssue[] {
  const byPath = new Map<
    string,
    { path: ReadonlyArray<string | number>; messages: string[] }
  >();
  for (const branch of branches) {
    for (const issue of branch) {
      const key = JSON.stringify(issue.path);
      const entry = byPath.get(key);
      if (entry) {
        if (!entry.messages.includes(issue.message)) {
          entry.messages.push(issue.message);
        }
      } else {
        byPath.set(key, { path: issue.path, messages: [issue.message] });
      }
    }
  }
  return Array.from(byPath.values()).map(({ path, messages }) => ({
    message: messages.join(' or '),
    path
  }));
}

/** @internal */
export function allOfFn(decoders: ReadonlyArray<DecodeFn<any>>): DecodeFn<any> {
  return (json: any) => {
    const isObj = isPlainObject(json);
    let lastJson = json;
    const allIssues: DecodingIssue[] = [];
    for (let i = 0; i < decoders.length; i++) {
      const result = decoders[i](lastJson);
      if (result.isOk()) {
        if (isObj) {
          lastJson = deepMerge({ target: lastJson, source: result.value });
        } else if (!Array.isArray(json)) {
          lastJson = result.value;
        }
      } else {
        allIssues.push(...result.issues);
      }
    }
    if (allIssues.length > 0) {
      return err(allIssues);
    }
    return ok(lastJson);
  };
}

/**
 * Deeply merges two plain objects into one. Arrays are not merged.
 */
function deepMerge<
  T extends Record<string, any>,
  U extends Record<string, any>
>({ target, source }: { target: T; source: U }): T & U {
  const result: Record<string, any> = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMerge({ target: targetValue, source: sourceValue });
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result as T & U;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/** @internal */
export function discriminatedUnionFn(
  discriminant: string,
  mapping: Record<string, DecodeFn<any>>
): DecodeFn<any> {
  return (json: any) => {
    if (json === null || typeof json !== 'object') {
      return err(primitiveError(json, 'object'));
    }
    const tag = json[discriminant];
    if (!Object.prototype.hasOwnProperty.call(mapping, tag)) {
      const expected = Object.keys(mapping)
        .map(key => JSON.stringify(key))
        .join(', ');
      return err([
        {
          message: `"${discriminant}" must be one of ${expected}, but got ${JSON.stringify(tag)}`,
          path: [discriminant]
        }
      ]);
    }
    return mapping[tag](json);
  };
}

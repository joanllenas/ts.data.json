---
title: Migrating to v4
category: Guides
group: Documents
---

# Migrating from v3 to v4

Version 4 of `ts.data.json` reworks how decoding errors are represented. In v3, a failed decode produced a single, pre-formatted error string. In v4, a failed decode produces a list of structured `issues`, where each issue carries a human-readable `message` and a `path` pointing to the exact field that failed.

This unlocks two things that were not possible before:

- **All failures are reported at once** instead of stopping at the first one.
- **Errors are machine-readable**, so you can map each issue back to a form field, a log entry, or any other structured target.

The public API surface is otherwise unchanged: decoders are still functions, the import style is still `import * as JsonDecoder from 'ts.data.json'`, and every decoder keeps the same name it had in v3.

## Table of Contents

- [Breaking Changes](#breaking-changes)
  - [1. Decoders no longer take a name argument](#1-decoders-no-longer-take-a-name-argument)
  - [2. New structured error model](#2-new-structured-error-model)
  - [3. parse() and decodePromise() now throw Error objects](#3-parse-and-decodepromise-now-throw-error-objects)
  - [4. The err() factory takes issues](#4-the-err-factory-takes-issues)
  - [5. Error message format changes](#5-error-message-format-changes)
  - [6. Removed deprecated aliases](#6-removed-deprecated-aliases)
- [New Capabilities](#new-capabilities)
  - [All errors at once](#all-errors-at-once)
  - [Structured issues with paths](#structured-issues-with-paths)
- [Quick Reference](#quick-reference)

## Breaking Changes

### 1. Decoders no longer take a name argument

In v3, several decoders required a trailing name string used to build error messages. In v4 that argument is gone, because the failing field is now identified by the issue `path` instead of by a name baked into the message.

The following decoders are affected:

| v3                                           | v4                                   |
| -------------------------------------------- | ------------------------------------ |
| `JsonDecoder.object(decoders, 'User')`       | `JsonDecoder.object(decoders)`       |
| `JsonDecoder.objectStrict(decoders, 'User')` | `JsonDecoder.objectStrict(decoders)` |
| `JsonDecoder.array(decoder, 'User[]')`       | `JsonDecoder.array(decoder)`         |
| `JsonDecoder.oneOf(decoders, 'Shape')`       | `JsonDecoder.oneOf(decoders)`        |
| `JsonDecoder.record(decoder, 'UserMap')`     | `JsonDecoder.record(decoder)`        |

Before:

```typescript
const userDecoder = JsonDecoder.object<User>(
  {
    id: JsonDecoder.number(),
    name: JsonDecoder.string()
  },
  'User'
);
```

After:

```typescript
const userDecoder = JsonDecoder.object<User>({
  id: JsonDecoder.number(),
  name: JsonDecoder.string()
});
```

### 2. New structured error model

In v3, the `Err` result held a single `error` string. In v4, it holds an `issues` array. Each entry is a `DecodingIssue`:

```typescript
interface DecodingIssue {
  message: string;
  path: ReadonlyArray<string | number>;
}
```

An empty `path` means the failure is at the root of the decoded value.

Before:

```typescript
const result = userDecoder.decode(badJson);
if (!result.isOk()) {
  console.log(result.error); // a single string
}
```

After:

```typescript
const result = userDecoder.decode(badJson);
if (!result.isOk()) {
  result.issues.forEach(issue => {
    const location = issue.path.length > 0 ? issue.path.join('.') : 'root';
    console.log(`${location}: ${issue.message}`);
  });
}
```

### 3. parse() and decodePromise() now throw Error objects

In v3, `parse()` threw the raw error string and `decodePromise()` rejected with the raw error string. In v4, both throw or reject a real `Error`:

- `error.message` is the formatted issues string (each issue rendered as `path.join('.'): message`, joined by `; `).
- `error.cause` is the structured `DecodingIssue[]`, so you can still inspect the issues programmatically.

Before:

```typescript
try {
  userDecoder.parse(badJson);
} catch (errorMessage) {
  console.log(errorMessage); // a string
}
```

After:

```typescript
try {
  userDecoder.parse(badJson);
} catch (error) {
  console.log(error.message); // formatted string, e.g. 'id: "x" is not a valid number'
  console.log(error.cause); // DecodingIssue[]
}
```

The same applies to the promise API:

```typescript
// Before: caught a string
userDecoder.decodePromise(badJson).catch(errorMessage => console.log(errorMessage));

// After: catches an Error
userDecoder.decodePromise(badJson).catch(error => console.log(error.message));
```

### 4. The err() factory takes issues

If you build custom decoders, the `err()` factory signature changed from a string to a list of issues.

Before:

```typescript
import { Decoder, ok, err } from 'ts.data.json';

const myStringDecoder = new Decoder<string>(json => (typeof json === 'string' ? ok(json) : err('Expected a string')));
```

After:

```typescript
import { Decoder, ok, err } from 'ts.data.json';

const myStringDecoder = new Decoder<string>(json => (typeof json === 'string' ? ok(json) : err([{ message: 'Expected a string', path: [] }])));
```

### 5. Error message format changes

Decoder names are no longer part of error messages, and the failing key or index is now carried by the issue `path` instead of being embedded in the message text.

| Concern            | v3 message                                                                                     | v4 message + path                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Object field       | `<User> decoder failed at key "id" with error: "x" is not a valid number`                      | `{ message: '"x" is not a valid number', path: ['id'] }`                        |
| Array index        | `<User[]> decoder failed at index "1" with error: 2 is not a valid string`                     | `{ message: '2 is not a valid string', path: [1] }`                             |
| Record value       | `<UserMap> record decoder failed at key "a" with error: "x" is not a valid number`             | `{ message: '"x" is not a valid number', path: ['a'] }`                         |
| oneOf              | `<Shape> decoder failed because true can't be decoded with any of the provided oneOf decoders` | a "no alternative matched" summary plus every alternative's failure (same-path issues collapsed into one "X or Y" message); see note below |
| Strict unknown key | `Unknown key "extra" found while processing strict <User> decoder`                             | `{ message: 'Unknown key "extra" found in strict object', path: [] }`           |
| Primitive          | `"x" is not a valid string`                                                                    | `{ message: '"x" is not a valid string', path: [] }` (unchanged message)        |

`oneOf` deserves a special mention. In v3 it always produced one generic "can't be decoded with any of the provided oneOf decoders" message. In v4, when no branch matches, it returns a `no alternative matched (tried N)` summary followed by every alternative's failure. Issues that share a `path` are collapsed into a single "X or Y" message so competing alternatives don't read as conjunctive requirements:

```typescript
type Shape = { kind: 'circle'; radius: number } | null;

const shapeDecoder = JsonDecoder.oneOf<Shape>([JsonDecoder.object({ kind: JsonDecoder.literal('circle'), radius: JsonDecoder.number() }), JsonDecoder.null()]);

shapeDecoder.decode({ kind: 'circle', radius: 'big' });
// Err({ issues: [
//   { message: 'no alternative matched (tried 2)', path: [] },
//   { message: '"big" is not a valid number', path: ['radius'] },
//   { message: '{"kind":"circle","radius":"big"} is not null', path: [] }
// ] })
```

An empty `oneOf([])` decoder list reports `{ message: 'no alternative matched (tried 0)', path: [] }`.

> **Tip:** for a union of objects that share a literal "tag" field, prefer the new [`discriminatedUnion`](#discriminatedunion) decoder — it validates only the matching variant and yields a precise, single-variant error instead of reporting every branch. See also the [Advanced Usage](advanced-usage.md) guide.

If you assert on error strings in your tests, switch to asserting on the structured `issues` array instead.

### 6. Removed deprecated aliases

The following aliases were deprecated during the v3.x line and are removed in v4. Switch to the replacement name; the behavior is identical.

| Removed in v4               | Use instead               |
| --------------------------- | ------------------------- |
| `JsonDecoder.dictionary()`  | `JsonDecoder.record()`    |
| `JsonDecoder.failover()`    | `JsonDecoder.fallback()`  |
| `JsonDecoder.isExactly()`   | `JsonDecoder.literal()`   |
| `decoder.chain()`           | `decoder.flatMap()`       |
| `decoder.decodeToPromise()` | `decoder.decodePromise()` |

## New Capabilities

### All errors at once

In v3, an object decoder stopped at the first failing field. In v4, every failing field is collected before returning, so you get the full picture in a single decode.

```typescript
const userDecoder = JsonDecoder.object<User>({
  id: JsonDecoder.number(),
  name: JsonDecoder.string()
});

userDecoder.decode({ id: 'not-a-number', name: 42 });
// Err({ issues: [
//   { message: '"not-a-number" is not a valid number', path: ['id'] },
//   { message: '42 is not a valid string', path: ['name'] }
// ] })
```

The same accumulation applies to `array`, `record`, and `objectStrict`.

### Structured issues with paths

Because each issue exposes a `path` from the root of the decoded value to the failing field, you can route errors anywhere without parsing strings:

```typescript
const result = userDecoder.decode({ id: 'bad', name: 42 });
if (!result.isOk()) {
  const fieldErrors = result.issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path.join('.');
    acc[field] = issue.message;
    return acc;
  }, {});
  // { id: '"bad" is not a valid number', name: '42 is not a valid string' }
}
```

This structure also lines up with the [Standard Schema](https://standardschema.dev) issue shape, which `ts.data.json` implements out of the box.

### discriminatedUnion

v4 adds `discriminatedUnion` for tagged unions of objects that share a literal "tag" field. You give it the tag field name and a map from each tag value to its variant decoder; it reads the tag, validates only the matching variant, and reports a precise error when the tag is unknown — without the noise `oneOf` produces by trying every branch.

```typescript
const shapeDecoder = JsonDecoder.discriminatedUnion('type', {
  circle: JsonDecoder.object({ type: JsonDecoder.literal('circle'), radius: JsonDecoder.number() }),
  rectangle: JsonDecoder.object({ type: JsonDecoder.literal('rectangle'), width: JsonDecoder.number(), height: JsonDecoder.number() })
});

shapeDecoder.decode({ type: 'circle', radius: 5 }); // Ok({ value: { type: 'circle', radius: 5 } })

// Only the matching variant is checked:
shapeDecoder.decode({ type: 'circle', radius: 'big' });
// Err({ issues: [{ message: '"big" is not a valid number', path: ['radius'] }] })

// An unknown tag lists the expected values:
shapeDecoder.decode({ type: 'triangle' });
// Err({ issues: [{ message: '"type" must be one of "circle", "rectangle", but got "triangle"', path: ['type'] }] })
```

## Quick Reference

|                                | v3                                           | v4                                                  |
| ------------------------------ | -------------------------------------------- | --------------------------------------------------- |
| Object decoder                 | `JsonDecoder.object(decoders, 'User')`       | `JsonDecoder.object(decoders)`                      |
| Strict object decoder          | `JsonDecoder.objectStrict(decoders, 'User')` | `JsonDecoder.objectStrict(decoders)`                |
| Array decoder                  | `JsonDecoder.array(decoder, 'User[]')`       | `JsonDecoder.array(decoder)`                        |
| oneOf decoder                  | `JsonDecoder.oneOf(decoders, 'Shape')`       | `JsonDecoder.oneOf(decoders)`                       |
| Record decoder                 | `JsonDecoder.record(decoder, 'UserMap')`     | `JsonDecoder.record(decoder)`                       |
| Read an error                  | `result.error`                               | `result.issues` (array of `{ message, path }`)      |
| Build an error                 | `err('message')`                             | `err([{ message: 'message', path: [] }])`           |
| Catch from parse/decodePromise | `catch(message => ...)`                      | `catch(error => error.message)` (and `error.cause`) |

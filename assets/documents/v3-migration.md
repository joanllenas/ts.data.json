---
title: Migrating to v3
category: Guides
group: Documents
---

# Migrating from v2.3.1 to v3

Version 3 of `ts.data.json` includes several breaking changes to improve the developer experience and reduce the library’s footprint. This guide will help you migrate your codebase.

## New Features

### Tree shaking

In v3 all schema and error functions are tree shakeable, meaning that you only bundle what you use.
The final weight of an app using only the `string()` decoder is just a few bytes.

### New decoders

There are a couple of new decoders for `null` and `undefined` values.

#### null()

```ts
JsonDecoder.null().decode(null); // Ok<null>({value: null})
JsonDecoder.null().decode(123); // Err({error: '123 is not a valid null'})
JsonDecoder.null().decode(undefined); // Err({error: 'undefined is not a valid null'})
```

#### undefined()

```ts
JsonDecoder.undefined().decode(undefined); // Ok<undefined>({value: undefined})
JsonDecoder.undefined().decode(123); // Err({error: '123 is not a valid undefined'})
JsonDecoder.undefined().decode(null); // Err({error: 'null is not a valid undefined'})
```

## Deprecations

You'll notice that there are a few deprecations. Basically some functions have a new name and the old name has been kept as an alias of the new function with a deprecation message.

## Breaking Changes

### 1. All decoders are functions

In v2, some decoders were variables and some were functions. In v3 all are functions.
Here's the list of the ones that have changed:

| v2 Decoder                            | v3 Decoder                              |
| ------------------------------------- | --------------------------------------- |
| `JsonDecoder.boolean.decode(...)`     | `JsonDecoder.boolean().decode(...)`     |
| `JsonDecoder.number.decode(...)`      | `JsonDecoder.number().decode(...)`      |
| `JsonDecoder.string.decode(...)`      | `JsonDecoder.string().decode(...)`      |
| `JsonDecoder.emptyObject.decode(...)` | `JsonDecoder.emptyObject().decode(...)` |
| `JsonDecoder.succeed.decode(...)`     | `JsonDecoder.succeed().decode(...)`     |

### 2. Removed stuff

In v3 some decoders have been removed either because they are redundant or don't work as expected.
There are also a few of the Decoder class metods that have been removed because they were either redundant or didn't work as expected.
Here's a list of the removed things and the recommended way of achieving the same result (if applicable):

| v2                                                           | v3                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `JsonDecoder.isNull('default value').decode(null)`           | `JsonDecoder.null().map(()=>'default value').decode(null)`           |
| `JsonDecoder.isUndefined('default value').decode(undefined)` | `JsonDecoder.undefined().map(()=>'default value').decode(undefined)` |
| `JsonDecoder.allOf()`                                        | n/a                                                                  |
| `JsonDecoder.combine()`                                      | n/a                                                                  |
| `myDecoder.fold(onOk, onErr)`                                | `myDecoder.decodePromise().then().catch()`                           |
| `myDecoder.mapError(()=>'something')`                        | `JsonDecoder.fallback('something', myDecoder)`                       |

### 2. Behaviour change

In v3 the `optional()` decoder only works with `undefined` values.
To replicate the same behaviour you can wither create your own optional decoder replica or combine existing decoders to achieve the same:

Write your own optional decoder from scratch:

```ts
import { Decoder, ok, string } from 'ts.data.json';

function v3Optional<T>(decoder: Decoder<T>): Decoder<T | undefined> {
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

v3Optional(string()).decode(null); // Ok(undefined)
v3Optional(string()).decode(undefined); // Ok(undefined)
v3Optional(string()).decode('hello'); // Ok('hello)
```

Write your own optional decoder using existing decoders:

```ts
const v3Optional = JsonDecoder.oneOf([JsonDecoder.string(), JsonDecoder.null().map(() => undefined), JsonDecoder.undefined()], 'optional string');
```

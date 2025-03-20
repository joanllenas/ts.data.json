---
title: Migrating to v3
category: Guides
group: Documents
---

# Migrating from v2.3.1 to v3

Version 3 of `ts.data.json` introduces several breaking changes to enhance the developer experience and reduce the library’s footprint. This guide will help you migrate your codebase.

## Table of Contents

- [New Features](#new-features)
  - [Tree-shaking](#tree-shaking)
  - [New decoders](#new-decoders)
    - [null()](#null)
    - [undefined()](#undefined)
- [Deprecations](#deprecations)
- [Breaking Changes](#breaking-changes)
  - [1. All decoders are functions](#1-all-decoders-are-functions)
  - [2. Removed items](#2-removed-items)
  - [3. Behaviour change](#3-behavior-change)

## New Features

### Tree-shaking

In v3, all schema and error functions are tree-shakeable, meaning you only bundle what you use.  
An app that only uses the `string()` decoder has a final size of just a few bytes.

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

You'll notice a few deprecations. Some functions have been renamed, while their old names remain as aliases with deprecation warnings.

## Breaking Changes

### 1. All decoders are functions

In v2, some decoders were variables, while others were functions. In v3, all are functions.  
Here’s a list of the ones that have changed:

| v2 Decoder                            | v3 Decoder                              |
| ------------------------------------- | --------------------------------------- |
| `JsonDecoder.boolean.decode(...)`     | `JsonDecoder.boolean().decode(...)`     |
| `JsonDecoder.number.decode(...)`      | `JsonDecoder.number().decode(...)`      |
| `JsonDecoder.string.decode(...)`      | `JsonDecoder.string().decode(...)`      |
| `JsonDecoder.emptyObject.decode(...)` | `JsonDecoder.emptyObject().decode(...)` |
| `JsonDecoder.succeed.decode(...)`     | `JsonDecoder.succeed().decode(...)`     |

### 2. Removed items

In v3, some decoders have been removed either due to redundancy or unexpected behavior.  
Some methods of the `Decoder` class have also been removed for similar reasons.  
Here’s a list of the removed items and their recommended replacements (if applicable):

| v2                                                           | v3                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `JsonDecoder.isNull('default value').decode(null)`           | `JsonDecoder.null().map(()=>'default value').decode(null)`           |
| `JsonDecoder.isUndefined('default value').decode(undefined)` | `JsonDecoder.undefined().map(()=>'default value').decode(undefined)` |
| `JsonDecoder.allOf()`                                        | n/a                                                                  |
| `JsonDecoder.combine()`                                      | n/a                                                                  |
| `myDecoder.fold(onOk, onErr)`                                | `myDecoder.decodePromise().then().catch()`                           |
| `myDecoder.mapError(()=>'something')`                        | `JsonDecoder.fallback('something', myDecoder)`                       |

### 3. Behavior change

In v3, the `optional()` decoder now only works with `undefined` values.  
To replicate the previous behavior, you can either create your own optional decoder or combine existing decoders.

#### Write your own optional decoder from scratch:

```ts
import { Decoder, ok, string } from 'ts.data.json';

function v3Optional<T>(decoder: Decoder<T>): Decoder<T | undefined> {
  return new Decoder<T | undefined>((json: any) => {
    if (json === undefined || json === null) {
      return ok<undefined>(undefined);
    } else {
      return decoder.decode(json);
    }
  });
}

v3Optional(string()).decode(null); // Ok(undefined)
v3Optional(string()).decode(undefined); // Ok(undefined)
v3Optional(string()).decode('hello'); // Ok('hello')
```

#### Write your own optional decoder using existing decoders:

```ts
import * as JsonDecoder from 'ts.data.json';

function v3Optional<T>(decoder: JsonDecoder.Decoder<T>) {
  return JsonDecoder.oneOf([decoder, JsonDecoder.null().map(() => undefined), JsonDecoder.undefined()], 'optional');
}

v3Optional(JsonDecoder.string()).decode(undefined); // Ok(undefined)
```

---
title: Migrating to v3
category: Guides
group: Documents
---

# Migrating from v2.3.1 to v3

Version 3 of `ts.data.json` introduces several breaking changes to enhance the developer experience and reduce the library’s footprint. This guide will help you migrate your codebase.

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
Here’s a list of deprecated functions and their new names:

| Deprecated Function             | New Name                  |
| ------------------------------- | ------------------------- |
| ~~`Decoder.decodeToPromise()`~~ | `Decoder.decodePromise()` |
| ~~`Decoder.chain()`~~           | `Decoder.flatMap()`       |
| ~~`JsonDecoder.failover()`~~    | `JsonDecoder.fallback()`  |
| ~~`JsonDecoder.isExactly()`~~   | `JsonDecoder.literal()`   |
| ~~`JsonDecoder.dictionary()`~~  | `JsonDecoder.record()`    |

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

#### optional()

In v3, the `optional()` decoder now only works with `undefined` values.  
To replicate the previous behavior, you can either create your own optional decoder or combine existing decoders.

- Write your own optional decoder from scratch:

```ts
import { Decoder, ok, string } from 'ts.data.json';

function v2Optional<T>(decoder: Decoder<T>): Decoder<T | undefined> {
  return new Decoder<T | undefined>((json: any) => {
    if (json === undefined || json === null) {
      return ok<undefined>(undefined);
    } else {
      return decoder.decode(json);
    }
  });
}

v2Optional(string()).decode(null); // Ok(undefined)
v2Optional(string()).decode(undefined); // Ok(undefined)
v2Optional(string()).decode('hello'); // Ok('hello')
```

- Write your own optional decoder using existing decoders:

```ts
import * as JsonDecoder from 'ts.data.json';

function v2Optional<T>(decoder: JsonDecoder.Decoder<T>) {
  return JsonDecoder.oneOf([decoder, JsonDecoder.null().map(() => undefined), JsonDecoder.undefined()], 'optional');
}

v2Optional(JsonDecoder.string()).decode(undefined); // Ok(undefined)
```

#### object()

In v3, the `object()` decoder function doesn't take the optional second parameter ~~`keyMap`~~ that was used to map incoming keys names to something different ([see 2.3.1 docs](https://joanllenas.github.io/ts.data.json/v2.3.1/functions/json-decoder.JsonDecoder.object.html)).

To replicate the previous behavior, you can use `map()` instead:

```ts
import * as JsonDecoder from 'ts.data.json';

const userDecoder = JsonDecoder.object(
  {
    user_name: JsonDecoder.string(),
    email: JsonDecoder.string()
  },
  'User'
).map(({ user_name, email }) => ({ userName: user_name, email }));

const decodedUser = userDecoder.decode({
  user_name: 'someuser',
  email: 'someuser@user.com'
}); // Ok({userName: 'someuser', email: 'someuser@user.com'})
```

# JsonDecoder

[![Build Status](https://travis-ci.org/joanllenas/ts.data.json.svg?branch=master)](https://travis-ci.org/joanllenas/ts.data.json)
[![npm version](https://badge.fury.io/js/ts.data.json.svg)](https://www.npmjs.com/package/ts.data.json)

Typescript type annotations give us compile-time guarantees, but at run-time, when data flows from the server to our clients, lots of things can go wrong.

JSON decoders validate the JSON before it comes into our program. So if the data has an unexpected structure, we learn about it immediately.

> If you are new to JSON decoding, you may want to read the introductory article [Decoding JSON with Typescript](https://dev.to/joanllenas/decoding-json-with-typescript-1jjc) about why and how to use this library.

[![](./.github/all-your-json-are-belong-to-us.jpg)](https://en.wikipedia.org/wiki/All_your_base_are_belong_to_us)

## Install

```
npm install ts.data.json --save
```

## Example

```ts
type User = {
  firstname: string;
  lastname: string;
};

const userDecoder = JsonDecoder.object<User>(
  {
    firstname: JsonDecoder.string,
    lastname: JsonDecoder.string
  },
  'User'
);

const jsonObjectOk = {
  firstname: 'Damien',
  lastname: 'Jurado'
};

userDecoder
  .decodePromise(jsonObjectOk)
  .then(user => {
    console.log(`User ${user.firstname} ${user.lastname} decoded successfully`);
  })
  .catch(error => {
    console.log(error);
  });

// Output: User Damien Jurado decoded successfully

const jsonObjectKo = {
  firstname: 'Erik',
  lastname: null
};

userDecoder
  .decodePromise(jsonObjectKo)
  .then(user => {
    console.log('User decoded successfully');
  })
  .catch(error => {
    console.error(error);
  });

// Output: <User> decoder failed at key "lastname" with error: null is not a valid string
```

## API

### JsonDecoder.string

> `string: Decoder<string>`

Creates a `string` decoder.

```ts
JsonDecoder.string.decode('hi'); // Ok<string>({value: 'hi'})
JsonDecoder.string.decode(5); // Err({error: '5 is not a valid string'})
```

### JsonDecoder.number

> `number: Decoder<number>`

Creates a `number` decoder.

```ts
JsonDecoder.number.decode(99); // Ok<number>({value: 99})
JsonDecoder.number.decode('hola'); // Err({error: 'hola is not a valid number'})
```

### JsonDecoder.boolean

> `boolean: Decoder<boolean>`

Creates a `boolean` decoder.

```ts
JsonDecoder.boolean.decode(true); // Ok<boolean>({value: true})
JsonDecoder.boolean.decode(null); // Err({error: 'null is not a valid boolean'})
```

### JsonDecoder.object

> `object<a>(decoders: DecoderObject<a>, decoderName: string, keyMap?: DecoderObjectKeyMap<a>): Decoder<a>`

Creates an `object` decoder.

#### @param `decoders: DecoderObject<a>`

Key/value pair that has to comply with the `<a>` type.

> Turns all optional keys to required, so you have to specify decoders even for the optional (i.e. with `{name?: string}`) keys.

#### @param `decoderName: string`

Type of the object we are decoding. i.e. `User`. It is used to generate meaningful decoding error messages.

#### @param `keyMap?: DecoderObjectKeyMap<a>`

Optional key/value pair to map JSON-land keys with Model-land keys.
Useful when the JSON keys don't match with the decoded type keys.

#### Basic example

```ts
type User = {
  firstname: string;
  lastname: string;
};
const userDecoder = JsonDecoder.object<User>(
  {
    firstname: JsonDecoder.string,
    lastname: JsonDecoder.string
  },
  'User'
);

const jsonOk = {
  firstname: 'Damien',
  lastname: 'Jurado'
};
userDecoder.decode(jsonOk);
// Output: Ok<User>({value: {firstname: 'Damien', lastname: 'Jurado'}})

const jsonKo = {
  firstname: null,
  lastname: 'Satie'
};
userDecoder.decode(jsonKo);
// Output: Err({error: '<User> decoder failed at key "firstname" with error: null is not a valid string'})
```

#### keyMap example

```ts
const userDecoder = JsonDecoder.object<User>(
  {
    firstname: JsonDecoder.string,
    lastname: JsonDecoder.string
  },
  'User',
  {
    firstname: 'fName',
    lastname: 'lName'
  }
);

const jsonOk = {
  fName: 'Nick',
  lName: 'Drake'
};
userDecoder.decode(json);
// Output: Ok({value: {firstname: 'Nick', lastname: 'Drake'}})

const jsonKo = {
  fName: 'Nick'
};
userDecoder.decode(json);
// Output: Err({error: '<User> decoder failed at key "lastname" (mapped from the JSON key "lName") with error: undefined is not a valid string'})
```

### JsonDecoder.objectStrict

> `objectStrict<a>(decoders: DecoderObject<a>, decoderName: string): Decoder<a>`

Creates an `object` decoder that performs strict key checks. It only accepts json objects with exactly the same keys as the decoder keys.

#### @param `decoders: DecoderObject<a>`

Key/value pair that has to comply with the `<a>` type.

#### @param `decoderName: string`

Type of the object we are decoding. i.e. `User`. It is used to generate meaningful decoding error messages.

#### Basic example

```ts
type User = {
  firstname: string;
  lastname: string;
};
const userDecoder = JsonDecoder.objectStrict<User>(
  {
    firstname: JsonDecoder.string,
    lastname: JsonDecoder.string
  },
  'User'
);

const jsonOk = {
  firstname: 'Damien',
  lastname: 'Jurado'
};
userDecoder.decode(jsonOk);
// Output: Ok<User>({value: {firstname: 'Damien', lastname: 'Jurado'}})

const jsonKo = {
  firstname: 'Damien',
  lastname: 'Jurado',
  email: 'damien@damienjurado.com'
};
userDecoder.decode(jsonKo);
// Output: Err({error: 'Unknown key "email" found while processing strict <User> decoder'})
```

### JsonDecoder.array

> `array<a>(decoder: Decoder<a>, decoderName: string): Decoder<Array<a>>`

Creates an `array` decoder.

#### @param `decoder: Decoder<a>`

The decoder used to decode every `Array<a>` item.

#### @param `decoderName: string`

Type of the object we are decoding. i.e. `User[]`. It is used to generate meaningful decoding error messages.

```ts
JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode([1, 2, 3]);
// Output: Ok<number[]>({value: [1, 2, 3]})

JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode([1, '2', 3]);
// Output: Err({error: '<number[]> decoder failed at index 1 with error: "2" is not a valid number'})
```

### JsonDecoder.dictionary

> `dictionary<a>(decoder: Decoder<a>, decoderName: string): Decoder<{ [name: string]: a }>`

Creates a `dictionary` decoder.

#### @param `decoder: Decoder<a>`

The decoder used to decode every value of the key/value pairs.

#### @param `decoderName: string`

Type of the object we are decoding. i.e. `User`. It is used to generate meaningful decoding error messages.

```ts
JsonDecoder.dictionary(JsonDecoder.number, 'Dict<number>').decode({
  a: 1,
  b: 2
});
// Output: Ok<Dict<number>>({value: {a: 1, b: 2}})

JsonDecoder.dictionary(JsonDecoder.number, 'Dict<number>').decode({
  a: 1,
  b: 2,
  c: null
});
// Output: Err({error: '<Dict<number>> dictionary decoder failed at key "c" with error: null is not a valid number'})
```

### JsonDecoder.oneOf

> `oneOf<a>(decoders: Array<Decoder<a>>, decoderName: string): Decoder<a>`

The `oneOf` decoder tries to decode the provided JSON with any of the provided decoders. It returns `Ok` with the first successful decoded value or `Err` if all decoders fail.

#### @param `decoders: Array<Decoder<a>>`

The Array of decoders the JSON can be decoded with.

#### @param `decoderName: string`

Type of the object we are decoding. i.e. `number | string`. It is used to generate meaningful decoding error messages.

```ts
JsonDecoder.oneOf<string | number>(
  [JsonDecoder.string, JsonDecoder.number],
  'string | number'
).decode(1);
// Output: Ok<string | number>({value: 1})

JsonDecoder.oneOf<string | number>(
  [JsonDecoder.string, JsonDecoder.number],
  'string | number'
).decode(true);
// Output: Err({error: "<string | number> decoder failed because true can't be decoded with any of the provided oneOf decoders"})
```

### JsonDecoder.allOf

> `allOf<T extends Array<Decoder<unknown>>, R = AllOfDecoderReturn<T>>(decoders: T): Decoder<R>`

The `allOf` decoder tries to decode the provided JSON with all of the provided decoders, in order. The output of one decoder is passed as input to the next decoder. It returns `Ok` with the last successful decoded value or `Err` if any decoder fails.

The `allOf` decoder allows you to combine multiple decoders. It is probably most useful when combined with custom decoders you may make for your application.

#### @param `decoders: T extends Array<Decoder<unknown>>`

An array of decoders the JSON should be decoded with.

Simple examples:

```ts
JsonDecoder.allOf(
 JsonDecoder.string,
 JsonDecoder.failover(10, JsonDecoder.number)
).decode('hola'),
// Output: Ok({value: 10})

JsonDecoder.allOf(
 JsonDecoder.string,
 JsonDecoder.failover(10, JsonDecoder.number)
).decode(5),
// Output: Err({error: "5 is not a valid string})
```

Example using a custom `hasLength()` decoder (an example [here](https://stackblitz.com/edit/typescript-97ergz)):

```ts
JsonDecoder.allOf(
  JsonDecoder.array(JsonDecoder.number, 'latLang'),
  hasLength<[number, number]>(2)
).decode([-123.34324, 23.454365]);
// Output: Ok({value: [-123.34324, 23.454365]})

JsonDecoder.allOf(
  JsonDecoder.array(JsonDecoder.number, 'latLang'),
  hasLength<[number, number]>(2)
).decode([1, 2, 3]);
// Output: Err({error: "hasLength() decoder failed because the provided array is of length 3."})
```

### JsonDecoder.lazy

> `lazy<a>(mkDecoder: () => Decoder<a>): Decoder<a>`

Decoder for recursive data structures.

#### @param `mkDecoder: () => Decoder<a>`

A function that returns a decoder.

```ts
type Node<a> = {
  value: a;
  children?: Node<a>[];
};
const treeDecoder: JsonDecoder.Decoder<Node<string>> = JsonDecoder.object<
  Node<string>
>(
  {
    value: JsonDecoder.string,
    children: JsonDecoder.oneOf<Node<string>[]>(
      [
        JsonDecoder.lazy(() => JsonDecoder.array(treeDecoder, 'Node<a>[]')),
        JsonDecoder.isUndefined([])
      ],
      'Node<string>[] | isUndefined'
    )
  },
  'Node<string>'
);
treeDecoder.decode({
  value: 'root',
  children: [
    { value: '1' },
    { value: '2', children: [{ value: '2.1' }, { value: '2.2' }] }
  ]
});
// Output: Ok<Node<string>>({value: {value: 'root', children: [....]}})

treeDecoder.decode({
  value: 'root',
  children: null
});
// Output: Err({error: "<Node<string>> decoder failed at key 'children' with error: <Node<string>[] | isUndefined> decoder failed because null can't be decoded with any of the provided oneOf decoders"})
```

### JsonDecoder.optional

> `optional<a>(decoder: Decoder<a>): Decoder<a | undefined>`

The `optional` decoder tries to decode the provided JSON with the provided decoder if the json value is not `undefined` or `null`. This decoder is to allow for an optional value in the TypeScript definition while retaining the ability to give a detailed error message if the wrapped decoder fails.

### JsonDecoder.nullable

> `nullable<a>(decoder: Decoder<a>): Decoder<a | null>`

The `nullable` decoder tries to decode the provided JSON with the provided decoder, but allows for `null` value. It returns a detailed error message if the value is not `null` and the wrapped decoder fails.

```ts
interface User {
  name: string;
  email: string | null;
}

const userDecoder = JsonDecoder.object<User>(
  {
    name: JsonDecoder.string,
    email: JsonDecoder.nullable(JsonDecoder.string)
  },
  'User'
);

userDecoder.decode({ name: 'Alice', email: 'alice@example.com' });
// Output: Ok<User>({value: {name: 'Alice', email: 'alice@example.com'}})

userDecoder.decode({ name: 'Alice', email: null });
// Output: Ok<User>({value: {name: 'Alice', email: null}})

userDecoder.decode({ name: 'Alice' });
// Output: Err({error: "<User> decoder failed at key 'email' with error: undefined is not a valid string"})
```

#### @param `decoder: Decoder<a>`

Decoder the JSON will be decoded with if the value is not `null` or `undefined`.

```ts
type User = {
  firstname: string;
  lastname: string;
  email?: string;
};
const userDecoder = JsonDecoder.object<User>(
  {
    firstname: JsonDecoder.string,
    lastname: JsonDecoder.string,
    email: JsonDecoder.optional(JsonDecoder.string)
  },
  'User'
);

const jsonOk = {
  firstname: 'Damien',
  lastname: 'Jurado'
};

const jsonFullUser = {
  firstname: 'Damien',
  lastname: 'Jurado',
  email: 'user@example.com'
};

const jsonKo = {
  firstname: null,
  lastname: 'Satie'
};

JsonDecoder.optional(userDecoder).decode(null);
// Output: Ok<User | undefined>({value: undefined})

JsonDecoder.optional(userDecoder).decode(undefined);
// Output: Ok<User | undefined>({value: undefined})

JsonDecoder.optional(userDecoder).decode(jsonOk);
// Output: Ok<User | undefined>({value: {firstname: 'Damien', lastname: 'Jurado', email: undefined}})

JsonDecoder.optional(userDecoder).decode(jsonFullUser);
// Output: Ok<User | undefined>({value: {firstname: 'Damien', lastname: 'Jurado', email: 'user@example.com'}})

JsonDecoder.optional(userDecoder).decode(jsonKo);
// Output: Err({error: '<User> decoder failed at key "firstname" with error: null is not a valid string'})
```

### JsonDecoder.failover

> `failover<a>(defaultValue: a, decoder: Decoder<a>): Decoder<a>`

Creates a decoder that returns a default value on failure.

#### @param `defaultValue: a`

The `Ok` default value when the decoder fails.

#### @param `decoder: Decoder<a>`

Decoder the JSON will be decoded with.

```ts
JsonDecoder.failover('default value', JsonDecoder.string).decode(
  'This is fine'
);
// Ok<string>({value: 'This is fine'})

JsonDecoder.failover('default value', JsonDecoder.string).decode(null);
// Ok<string>({value: 'default value'})
```

### JsonDecoder.succeed

> `succeed: Decoder<any>`

Creates a decoder that always succeeds.

```ts
JsonDecoder.succeed.decode(null); // Ok<any>({value: null})
```

### JsonDecoder.fail

> `fail<a>(error: string): Decoder<a>`

Creates a decoder that always fails.

#### @param `error: string`

Error message that will be returned with the `Err` instance.

```ts
JsonDecoder.fail('Something wrong happened').decode('This is fine');
// Err({error: 'Something wrong happened'})
```

### JsonDecoder.isNull

> `isNull<a>(defaultValue: a): Decoder<a>`

Succeeds when JSON is strictly (===) null and returns a defaultValue.

#### @param `defaultValue: a`

Returned default value when JSON is null.

```ts
JsonDecoder.isNull('default value').decode(null);
// Ok({value: 'default value'})

JsonDecoder.isNull('default value').decode(999);
// Err({error: '999 is not null'})
```

### JsonDecoder.isUndefined

> `isUndefined<a>(defaultValue: a): Decoder<a>`

Succeeds when JSON is strictly (===) undefined and returns a defaultValue.

#### @param `defaultValue: a`

Returned default value when JSON is undefined.

```ts
JsonDecoder.isUndefined('default value').decode(undefined);
// Ok({value: 'default value'})

JsonDecoder.isUndefined('default value').decode(999);
// Err({error: '999 is not undefined'})
```

### JsonDecoder.isExactly

> `isExactly<a>(value: a): Decoder<a>`

Succeeds when JSON is strictly (===) `value: a` and returns `value: a`.

#### @param `value: a`

Value returned when the JSON is strictly equal to it.

```ts
JsonDecoder.isExactly(true).decode(true);
// Ok({value: true})

JsonDecoder.isExactly(999).decode(true);
// Err({error: 'true is not 999'})
```

### JsonDecoder.constant

> `constant<a>(value: a): Decoder<a>`

A Decoder that always succeeds, returning `value`.

#### @param `value: a`

Value always returned.

```ts
JsonDecoder.constant(true).decode(false);
// Ok({value: true})
```

### JsonDecoder.combine

A `combine` decoder tries to decode the provided JSON with all of the provided decoders and returns an intersection of them all.

Value always returned.

```ts
type User = { id: string };
type WithName = { name: string };
type WithAge = { age: number };

const userDecoder = JsonDecoder.object<User>(
  { id: JsonDecoder.string },
  'User'
);

const nameDecoder = JsonDecoder.object<WithName>(
  { name: JsonDecoder.string },
  'WithName'
);

const ageDecoder = JsonDecoder.object<WithAge>(
  { age: JsonDecoder.number },
  'WithAge'
);

const finalDecoder = JsonDecoder.combine(userDecoder, nameDecoder, ageDecoder);
// Decoder<User & WithName & WithAge>

finalDecoder.decode({ id: 'alice', name: 'Alice', age: 30 });
// Ok({ id: 'alice', name: 'Alice', age: 30 })

finalDecoder.decode({ id: 'alice' });
// Err({ error: '<WithName> decoder failed at key "name" with error: undefined is not a valid string' })
```

## Related libraries

- https://github.com/gcanti/io-ts
- https://github.com/kofno/jsonous
- https://github.com/jquense/yup
- https://gitlab.com/john.carroll.p/ts-decoders

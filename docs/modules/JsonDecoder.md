[ts.data.json Documentation - v2.3.0](../README.md) / [Exports](../modules.md) / JsonDecoder

# Namespace: JsonDecoder

TypeScript type annotations provide compile-time guarantees. However, when data flows into our clients from external sources, many things can go wrong at runtime.

JSON decoders validate our JSON before it enters our program. This way, if the data has an unexpected structure, we're immediately alerted.

**`Example`**

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
  .decodeToPromise(jsonObjectOk)
  .then(user => {
    console.log(`User ${user.firstname} ${user.lastname} decoded successfully`);
  })
  .catch(error => {
    console.log(error);
  });
```

## Table of contents

### Classes

- [Decoder](../classes/JsonDecoder.Decoder.md)

### Type Aliases

- [DecoderObject](JsonDecoder.md#decoderobject)
- [DecoderObjectKeyMap](JsonDecoder.md#decoderobjectkeymap)

### Variables

- [string](JsonDecoder.md#string)
- [number](JsonDecoder.md#number)
- [boolean](JsonDecoder.md#boolean)
- [emptyObject](JsonDecoder.md#emptyobject)
- [succeed](JsonDecoder.md#succeed)

### Functions

- [lazy](JsonDecoder.md#lazy)
- [enumeration](JsonDecoder.md#enumeration)
- [object](JsonDecoder.md#object)
- [objectStrict](JsonDecoder.md#objectstrict)
- [fail](JsonDecoder.md#fail)
- [failover](JsonDecoder.md#failover)
- [optional](JsonDecoder.md#optional)
- [nullable](JsonDecoder.md#nullable)
- [oneOf](JsonDecoder.md#oneof)
- [allOf](JsonDecoder.md#allof)
- [dictionary](JsonDecoder.md#dictionary)
- [array](JsonDecoder.md#array)
- [tuple](JsonDecoder.md#tuple)
- [isNull](JsonDecoder.md#isnull)
- [isUndefined](JsonDecoder.md#isundefined)
- [constant](JsonDecoder.md#constant)
- [isExactly](JsonDecoder.md#isexactly)
- [combine](JsonDecoder.md#combine)

## Type Aliases

### DecoderObject

Ƭ **DecoderObject**\<`a`\>: \{ [p in keyof Required\<a\>]: Decoder\<a[p]\> }

#### Type parameters

| Name |
| :------ |
| `a` |

#### Defined in

[json-decoder.ts:345](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L345)

___

### DecoderObjectKeyMap

Ƭ **DecoderObjectKeyMap**\<`a`\>: \{ [p in keyof a]?: string }

#### Type parameters

| Name |
| :------ |
| `a` |

#### Defined in

[json-decoder.ts:346](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L346)

## Variables

### string

• `Const` **string**: [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`string`\>

Decoder for `string` values.

**`Example`**

```ts
JsonDecoder.string.decode('hi'); // Ok<string>({value: 'hi'})
JsonDecoder.string.decode(5); // Err({error: '5 is not a valid string'})
```

#### Defined in

[json-decoder.ts:239](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L239)

___

### number

• `Const` **number**: [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`number`\>

Decoder for `number` values.

**`Example`**

```ts
JsonDecoder.number.decode(99); // Ok<number>({value: 99})
JsonDecoder.number.decode('hola'); // Err({error: 'hola is not a valid number'})
```

#### Defined in

[json-decoder.ts:258](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L258)

___

### boolean

• `Const` **boolean**: [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`boolean`\>

Decoder for `boolean` values.

**`Example`**

```ts
JsonDecoder.boolean.decode(true); // Ok<boolean>({value: true})
JsonDecoder.boolean.decode('true'); // Err({error: 'true is not a valid boolean'})
```

#### Defined in

[json-decoder.ts:277](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L277)

___

### emptyObject

• `Const` **emptyObject**: [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`EmptyObject`\>

Decoder for an empty object ({}).

**`Example`**

```ts
JsonDecoder.emptyObject.decode({}); // Ok<EmptyObject>({value: {}})
JsonDecoder.emptyObject.decode({a: 1}); // Err({error: '{a: 1} is not a valid empty object'})
```

#### Defined in

[json-decoder.ts:297](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L297)

___

### succeed

• `Const` **succeed**: [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`any`\>

Decoder that always succeeds with the given value.

**`Example`**

```ts
const succeedDecoder = JsonDecoder.succeed;
succeedDecoder.decode('anything'); // Ok<any>({value: 'anything'})
```

#### Defined in

[json-decoder.ts:501](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L501)

## Functions

### lazy

▸ **lazy**\<`a`\>(`mkDecoder`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder for recursive data structures.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `mkDecoder` | () => [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\> | A function that returns a decoder |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that can handle recursive data structures

**`Example`**

```ts
interface Tree {
  value: number;
  children?: Tree[];
}

const treeDecoder = JsonDecoder.lazy(() =>
  JsonDecoder.object<Tree>(
    {
      value: JsonDecoder.number,
      children: JsonDecoder.optional(JsonDecoder.array(treeDecoder))
    },
    'Tree'
  )
);
```

#### Defined in

[json-decoder.ts:224](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L224)

___

### enumeration

▸ **enumeration**\<`e`\>(`enumObj`, `decoderName`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`e`\>

Decoder for `enumeration` values.

#### Type parameters

| Name |
| :------ |
| `e` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `enumObj` | `object` | The enum object to use for decoding. Must not be a const enum. |
| `decoderName` | `string` | How to display the name of the object being decoded in errors. |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`e`\>

A decoder that validates and returns enum values

**`Example`**

```ts
enum Color {
  Red = 'red',
  Blue = 'blue'
}

const colorDecoder = JsonDecoder.enumeration(Color, 'Color');
colorDecoder.decode('red'); // Ok<Color>({value: Color.Red})
colorDecoder.decode('green'); // Err({error: '<Color> decoder failed at value "green" which is not in the enum'})
```

#### Defined in

[json-decoder.ts:332](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L332)

___

### object

▸ **object**\<`a`\>(`decoders`, `decoderName`, `keyMap?`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder for objects with specified field decoders.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoders` | [`DecoderObject`](JsonDecoder.md#decoderobject)\<`a`\> | Key/value pairs of decoders for each object field. |
| `decoderName` | `string` | How to display the name of the object being decoded in errors. |
| `keyMap?` | [`DecoderObjectKeyMap`](JsonDecoder.md#decoderobjectkeymap)\<`a`\> | Optional map between json field names and user land field names. Useful when the client model does not match with what the server sends. |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that validates and returns objects matching the specified structure

**`Example`**

```ts
interface User {
  firstName: string;
  lastName: string;
  age: number;
}

const userDecoder = JsonDecoder.object<User>(
  {
    firstName: JsonDecoder.string,
    lastName: JsonDecoder.string,
    age: JsonDecoder.number
  },
  'User',
  {
    firstName: 'first_name',
    lastName: 'last_name'
  }
);

const json = {
  first_name: 'John',
  last_name: 'Doe',
  age: 30
};

userDecoder.decode(json); // Ok<User>({value: {firstName: 'John', lastName: 'Doe', age: 30}})
```

#### Defined in

[json-decoder.ts:387](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L387)

___

### objectStrict

▸ **objectStrict**\<`a`\>(`decoders`, `decoderName`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder for objects with specified field decoders that fails if unknown fields are present.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoders` | [`DecoderObject`](JsonDecoder.md#decoderobject)\<`a`\> | Key/value pairs of decoders for each object field. |
| `decoderName` | `string` | How to display the name of the object being decoded in errors. |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that validates and returns objects matching the specified structure, failing if unknown fields are present

**`Example`**

```ts
interface User {
  name: string;
  age: number;
}

const userDecoder = JsonDecoder.objectStrict<User>(
  {
    name: JsonDecoder.string,
    age: JsonDecoder.number
  },
  'User'
);

userDecoder.decode({name: 'John', age: 30}); // Ok<User>
userDecoder.decode({name: 'John', age: 30, extra: 'field'}); // Err({error: 'Unknown key "extra" found while processing strict <User> decoder'})
```

#### Defined in

[json-decoder.ts:457](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L457)

___

### fail

▸ **fail**\<`a`\>(`error`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder that always fails with the given error message.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `string` | The error message to return |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that always fails with the specified error

**`Example`**

```ts
const failDecoder = JsonDecoder.fail<string>('This decoder always fails');
failDecoder.decode('anything'); // Err({error: 'This decoder always fails'})
```

#### Defined in

[json-decoder.ts:517](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L517)

___

### failover

▸ **failover**\<`a`\>(`defaultValue`, `decoder`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder that falls back to a default value if the given decoder fails.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `defaultValue` | `a` | The value to return if the decoder fails |
| `decoder` | [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\> | The decoder to try first |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that returns the default value if the given decoder fails

**`Example`**

```ts
const numberOrZero = JsonDecoder.failover(0, JsonDecoder.number);
numberOrZero.decode(42); // Ok<number>({value: 42})
numberOrZero.decode('not a number'); // Ok<number>({value: 0})
```

#### Defined in

[json-decoder.ts:537](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L537)

___

### optional

▸ **optional**\<`a`\>(`decoder`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a` \| `undefined`\>

Decoder that makes a field optional.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoder` | [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\> | The decoder for the field when it is present |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a` \| `undefined`\>

A decoder that accepts either the decoded value or undefined

**`Example`**

```ts
interface User {
  name: string;
  age?: number;
}

const userDecoder = JsonDecoder.object<User>(
  {
    name: JsonDecoder.string,
    age: JsonDecoder.optional(JsonDecoder.number)
  },
  'User'
);

userDecoder.decode({name: 'John'}); // Ok<User>
userDecoder.decode({name: 'John', age: 30}); // Ok<User>
```

#### Defined in

[json-decoder.ts:576](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L576)

___

### nullable

▸ **nullable**\<`a`\>(`decoder`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a` \| ``null``\>

Decoder that accepts null values.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoder` | [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\> | The decoder for the non-null value |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a` \| ``null``\>

A decoder that accepts either the decoded value or null

**`Example`**

```ts
interface User {
  name: string;
  age: number | null;
}

const userDecoder = JsonDecoder.object<User>(
  {
    name: JsonDecoder.string,
    age: JsonDecoder.nullable(JsonDecoder.number)
  },
  'User'
);

userDecoder.decode({name: 'John', age: null}); // Ok<User>
userDecoder.decode({name: 'John', age: 30}); // Ok<User>
```

#### Defined in

[json-decoder.ts:613](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L613)

___

### oneOf

▸ **oneOf**\<`a`\>(`decoders`, `decoderName`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder that tries multiple decoders in sequence until one succeeds.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoders` | [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>[] | Array of decoders to try in sequence |
| `decoderName` | `string` | How to display the name of the object being decoded in errors |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that tries each decoder in sequence until one succeeds

**`Example`**

```ts
const stringOrNumber = JsonDecoder.oneOf<string | number>(
  [JsonDecoder.string, JsonDecoder.number],
  'StringOrNumber'
);

stringOrNumber.decode('hello'); // Ok<string>({value: 'hello'})
stringOrNumber.decode(42); // Ok<number>({value: 42})
stringOrNumber.decode(true); // Err({error: '<StringOrNumber> decoder failed because true is not a valid value'})
```

#### Defined in

[json-decoder.ts:641](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L641)

___

### allOf

▸ **allOf**\<`T`, `R`\>(`...decoders`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`R`\>

Decoder that combines multiple decoders into a single decoder.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`unknown`\>[] |
| `R` | `R` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...decoders` | [...T[], [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`R`\>] | Array of decoders to combine |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`R`\>

A decoder that combines the results of multiple decoders

**`Example`**

```ts
interface User {
  name: string;
  age: number;
  email: string;
}

const userDecoder = JsonDecoder.combine(
  JsonDecoder.object({name: JsonDecoder.string}, 'User'),
  JsonDecoder.object({age: JsonDecoder.number}, 'User'),
  JsonDecoder.object({email: JsonDecoder.string}, 'User')
);

userDecoder.decode({name: 'John', age: 30, email: 'john@example.com'}); // Ok<User>
```

#### Defined in

[json-decoder.ts:679](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L679)

___

### dictionary

▸ **dictionary**\<`a`\>(`decoder`, `decoderName`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<\{ `[name: string]`: `a`;  }\>

Decoder for dictionary/record types with string keys.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoder` | [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\> | The decoder for the dictionary values |
| `decoderName` | `string` | How to display the name of the object being decoded in errors |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<\{ `[name: string]`: `a`;  }\>

A decoder that validates and returns a dictionary with string keys

**`Example`**

```ts
const numberDict = JsonDecoder.dictionary(JsonDecoder.number, 'NumberDict');

numberDict.decode({a: 1, b: 2}); // Ok<Record<string, number>>
numberDict.decode({a: '1', b: 2}); // Err({error: '<NumberDict> dictionary decoder failed at key "a" with error: "1" is not a valid number'})
```

#### Defined in

[json-decoder.ts:706](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L706)

___

### array

▸ **array**\<`a`\>(`decoder`, `decoderName`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`[]\>

Decoder for arrays.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoder` | [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\> | The decoder for array elements |
| `decoderName` | `string` | How to display the name of the object being decoded in errors |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`[]\>

A decoder that validates and returns arrays

**`Example`**

```ts
const numberArray = JsonDecoder.array(JsonDecoder.number, 'NumberArray');

numberArray.decode([1, 2, 3]); // Ok<number[]>
numberArray.decode([1, '2', 3]); // Err({error: '<NumberArray> decoder failed at index "1" with error: "2" is not a valid number'})
```

#### Defined in

[json-decoder.ts:753](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L753)

___

### tuple

▸ **tuple**\<`T`\>(`decoders`, `decoderName`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`TupleOfResults`\<`T`\>\>

Decoder for tuples with fixed length and types.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends readonly [] \| readonly [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`any`\>[] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decoders` | `T` | Array of decoders for each tuple element |
| `decoderName` | `string` | How to display the name of the object being decoded in errors |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`TupleOfResults`\<`T`\>\>

A decoder that validates and returns tuples

**`Example`**

```ts
const pointDecoder = JsonDecoder.tuple(
  [JsonDecoder.number, JsonDecoder.number],
  'Point'
);

pointDecoder.decode([1, 2]); // Ok<[number, number]>
pointDecoder.decode([1, 2, 3]); // Err({error: '<Point> tuple decoder failed because it received a tuple of length 3 but expected 2'})
```

#### Defined in

[json-decoder.ts:799](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L799)

___

### isNull

▸ **isNull**\<`a`\>(`defaultValue`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder that accepts null values and returns a default value.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `defaultValue` | `a` | The value to return when null is encountered |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that accepts null and returns the default value

**`Example`**

```ts
const numberOrZero = JsonDecoder.isNull(0);

numberOrZero.decode(null); // Ok<number>({value: 0})
numberOrZero.decode(42); // Err({error: '42 is not null'})
```

#### Defined in

[json-decoder.ts:849](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L849)

___

### isUndefined

▸ **isUndefined**\<`a`\>(`defaultValue`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder that accepts undefined values and returns a default value.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `defaultValue` | `a` | The value to return when undefined is encountered |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that accepts undefined and returns the default value

**`Example`**

```ts
const numberOrZero = JsonDecoder.isUndefined(0);

numberOrZero.decode(undefined); // Ok<number>({value: 0})
numberOrZero.decode(42); // Err({error: '42 is not undefined'})
```

#### Defined in

[json-decoder.ts:873](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L873)

___

### constant

▸ **constant**\<`a`\>(`value`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder that only accepts a specific constant value.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `a` | The constant value to accept |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that only accepts the specified value

**`Example`**

```ts
const trueDecoder = JsonDecoder.constant(true);

trueDecoder.decode(true); // Ok<boolean>({value: true})
trueDecoder.decode(false); // Err({error: 'false is not exactly true'})
```

#### Defined in

[json-decoder.ts:897](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L897)

___

### isExactly

▸ **isExactly**\<`a`\>(`value`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

Decoder that only accepts a specific value.

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `a` | The exact value to accept |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`a`\>

A decoder that only accepts the specified value

**`Example`**

```ts
const oneDecoder = JsonDecoder.isExactly(1);

oneDecoder.decode(1); // Ok<number>({value: 1})
oneDecoder.decode(2); // Err({error: '2 is not exactly 1'})
```

#### Defined in

[json-decoder.ts:915](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L915)

___

### combine

▸ **combine**\<`TS`\>(`...decoders`): [`Decoder`](../classes/JsonDecoder.Decoder.md)\<`Combine`\<`TS`\>\>

Combines multiple decoders into a single decoder that merges their results.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TS` | extends \{ `[k: string]`: `any`;  }[] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...decoders` | \{ [T in string \| number \| symbol]: Decoder\<TS[T\<T\>]\> } | Array of decoders to combine |

#### Returns

[`Decoder`](../classes/JsonDecoder.Decoder.md)\<`Combine`\<`TS`\>\>

A decoder that combines the results of multiple decoders

**`Example`**

```ts
interface User {
  name: string;
  age: number;
  email: string;
}

const userDecoder = JsonDecoder.combine(
  JsonDecoder.object({name: JsonDecoder.string}, 'User'),
  JsonDecoder.object({age: JsonDecoder.number}, 'User'),
  JsonDecoder.object({email: JsonDecoder.string}, 'User')
);

userDecoder.decode({name: 'John', age: 30, email: 'john@example.com'}); // Ok<User>
```

#### Defined in

[json-decoder.ts:978](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L978)

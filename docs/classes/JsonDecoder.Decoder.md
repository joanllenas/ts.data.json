[ts.data.json Documentation - v2.3.0](../README.md) / [Exports](../modules.md) / [JsonDecoder](../modules/JsonDecoder.md) / Decoder

# Class: Decoder\<a\>

[JsonDecoder](../modules/JsonDecoder.md).Decoder

A decoder that can validate and transform JSON data into strongly typed TypeScript values.

## Type parameters

| Name | Description |
| :------ | :------ |
| `a` | The type that this decoder will produce when successful |

## Implements

- `StandardSchemaV1`\<`unknown`, `a`\>

## Table of contents

### Constructors

- [constructor](JsonDecoder.Decoder.md#constructor)

### Properties

- [~standard](JsonDecoder.Decoder.md#~standard)

### Methods

- [decode](JsonDecoder.Decoder.md#decode)
- [fold](JsonDecoder.Decoder.md#fold)
- [decodeToPromise](JsonDecoder.Decoder.md#decodetopromise)
- [map](JsonDecoder.Decoder.md#map)
- [mapError](JsonDecoder.Decoder.md#maperror)
- [chain](JsonDecoder.Decoder.md#chain)

## Constructors

### constructor

• **new Decoder**\<`a`\>(`decodeFn`): [`Decoder`](JsonDecoder.Decoder.md)\<`a`\>

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `decodeFn` | (`json`: `any`) => [`Result`](../modules.md#result)\<`a`\> |

#### Returns

[`Decoder`](JsonDecoder.Decoder.md)\<`a`\>

#### Defined in

[json-decoder.ts:49](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L49)

## Properties

### ~standard

• **~standard**: `Props`\<`unknown`, `a`\>

The Standard Schema interface for this decoder.

#### Implementation of

StandardSchemaV1.~standard

#### Defined in

[json-decoder.ts:69](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L69)

## Methods

### decode

▸ **decode**(`json`): [`Result`](../modules.md#result)\<`a`\>

Decodes a JSON object of type <a> and returns a Result<a>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `json` | `any` | The JSON object to decode |

#### Returns

[`Result`](../modules.md#result)\<`a`\>

A Result containing either the decoded value or an error message

**`Example`**

```ts
JsonDecoder.string.decode('hi'); // Ok<string>({value: 'hi'})
JsonDecoder.string.decode(5); // Err({error: '5 is not a valid string'})
```

#### Defined in

[json-decoder.ts:62](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L62)

___

### fold

▸ **fold**\<`b`\>(`onOk`, `onErr`, `json`): `b`

Decodes a JSON object of type <a> and calls onOk() on success or onErr() on failure, both return <b>

#### Type parameters

| Name |
| :------ |
| `b` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `onOk` | (`result`: `a`) => `b` | function called when the decoder succeeds |
| `onErr` | (`error`: `string`) => `b` | function called when the decoder fails |
| `json` | `any` | The JSON object to decode |

#### Returns

`b`

The result of either onOk or onErr

**`Example`**

```ts
JsonDecoder.string.fold(
  (value: string) => parseInt(value, 10),
  (error: string) => 0,
  '000000000001'
); // 1
```

#### Defined in

[json-decoder.ts:99](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L99)

___

### decodeToPromise

▸ **decodeToPromise**(`json`): `Promise`\<`a`\>

Decodes a JSON object of type <a> and returns a Promise<a>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `json` | `any` | The JSON object to decode |

#### Returns

`Promise`\<`a`\>

A Promise that resolves with the decoded value or rejects with an error message

**`Example`**

```ts
JsonDecoder.string.decodeToPromise('hola').then(res => console.log(res)); // 'hola'
JsonDecoder.string.decodeToPromise(2).catch(err => console.log(err)); // '2 is not a valid string'
```

#### Defined in

[json-decoder.ts:119](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L119)

___

### map

▸ **map**\<`b`\>(`fn`): [`Decoder`](JsonDecoder.Decoder.md)\<`b`\>

If the decoder has succeeded, transforms the decoded value into something else

#### Type parameters

| Name |
| :------ |
| `b` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `a`) => `b` | The transformation function |

#### Returns

[`Decoder`](JsonDecoder.Decoder.md)\<`b`\>

A new decoder that applies the transformation

**`Example`**

```ts
// Decode a string, then transform it into a Date
const dateDecoder = JsonDecoder.string.map(stringDate => new Date(stringDate));
// Ok scenario
dateDecoder.decode('2018-12-21T18:22:25.490Z'); // Ok<Date>({value: Date(......)})
// Err scenario
dateDecoder.decode(false); // Err({error: 'false is not a valid string'})
```

#### Defined in

[json-decoder.ts:145](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L145)

___

### mapError

▸ **mapError**\<`b`\>(`fn`): [`Decoder`](JsonDecoder.Decoder.md)\<`a` \| `b`\>

TODO: Add documentation in the readme
If the decoder has failed, transforms the error into an Ok value

#### Type parameters

| Name |
| :------ |
| `b` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`error`: `string`) => `b` | The transformation function |

#### Returns

[`Decoder`](JsonDecoder.Decoder.md)\<`a` \| `b`\>

#### Defined in

[json-decoder.ts:161](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L161)

___

### chain

▸ **chain**\<`b`\>(`fn`): [`Decoder`](JsonDecoder.Decoder.md)\<`b`\>

Chain decoders that might fail

#### Type parameters

| Name |
| :------ |
| `b` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `a`) => [`Decoder`](JsonDecoder.Decoder.md)\<`b`\> | Function that returns a new decoder |

#### Returns

[`Decoder`](JsonDecoder.Decoder.md)\<`b`\>

A new decoder that chains the current decoder with the result of fn

**`Example`**

```ts
const adultDecoder = JsonDecoder.number.chain(age =>
  age >= 18
    ? JsonDecoder.succeed
    : JsonDecoder.fail(`Age ${age} is less than 18`)
);
adultDecoder.decode(18); // Ok<number>({value: 18})
adultDecoder.decode(17); // Err({error: 'Age 17 is less than 18'})
```

#### Defined in

[json-decoder.ts:188](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L188)

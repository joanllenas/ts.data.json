[ts.data.json Documentation - v2.3.0](../README.md) / [Exports](../modules.md) / Err

# Class: Err\<a\>

## Type parameters

| Name |
| :------ |
| `a` |

## Table of contents

### Constructors

- [constructor](Err.md#constructor)

### Properties

- [error](Err.md#error)

### Methods

- [map](Err.md#map)
- [isOk](Err.md#isok)

## Constructors

### constructor

• **new Err**\<`a`\>(`error`): [`Err`](Err.md)\<`a`\>

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `string` |

#### Returns

[`Err`](Err.md)\<`a`\>

#### Defined in

[result.ts:14](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L14)

## Properties

### error

• `Readonly` **error**: `string`

#### Defined in

[result.ts:14](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L14)

## Methods

### map

▸ **map**\<`b`\>(`_fn`): [`Result`](../modules.md#result)\<`b`\>

#### Type parameters

| Name |
| :------ |
| `b` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `_fn` | (`a`: `a`) => `b` |

#### Returns

[`Result`](../modules.md#result)\<`b`\>

#### Defined in

[result.ts:16](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L16)

___

### isOk

▸ **isOk**(): this is Ok\<a\>

#### Returns

this is Ok\<a\>

#### Defined in

[result.ts:20](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L20)

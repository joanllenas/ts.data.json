[ts.data.json Documentation - v2.3.0](../README.md) / [Exports](../modules.md) / Ok

# Class: Ok\<a\>

## Type parameters

| Name |
| :------ |
| `a` |

## Table of contents

### Constructors

- [constructor](Ok.md#constructor)

### Properties

- [value](Ok.md#value)

### Methods

- [map](Ok.md#map)
- [isOk](Ok.md#isok)

## Constructors

### constructor

• **new Ok**\<`a`\>(`value`): [`Ok`](Ok.md)\<`a`\>

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `a` |

#### Returns

[`Ok`](Ok.md)\<`a`\>

#### Defined in

[result.ts:2](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L2)

## Properties

### value

• `Readonly` **value**: `a`

#### Defined in

[result.ts:2](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L2)

## Methods

### map

▸ **map**\<`b`\>(`fn`): [`Result`](../modules.md#result)\<`b`\>

#### Type parameters

| Name |
| :------ |
| `b` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`a`: `a`) => `b` |

#### Returns

[`Result`](../modules.md#result)\<`b`\>

#### Defined in

[result.ts:4](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L4)

___

### isOk

▸ **isOk**(): this is Ok\<a\>

#### Returns

this is Ok\<a\>

#### Defined in

[result.ts:8](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L8)

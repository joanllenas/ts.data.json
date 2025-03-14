[ts.data.json Documentation - v2.3.0](README.md) / Exports

# ts.data.json Documentation - v2.3.0

## Table of contents

### Namespaces

- [JsonDecoder](modules/JsonDecoder.md)

### Classes

- [Ok](classes/Ok.md)
- [Err](classes/Err.md)

### Type Aliases

- [FromDecoder](modules.md#fromdecoder)
- [Result](modules.md#result)

### Functions

- [ok](modules.md#ok)
- [err](modules.md#err)

## Type Aliases

### FromDecoder

Ƭ **FromDecoder**\<`Decoder`\>: `Decoder` extends [`Decoder`](classes/JsonDecoder.Decoder.md)\<infer T\> ? `T` : `never`

#### Type parameters

| Name |
| :------ |
| `Decoder` |

#### Defined in

[json-decoder.ts:4](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/json-decoder.ts#L4)

___

### Result

Ƭ **Result**\<`a`\>: [`Ok`](classes/Ok.md)\<`a`\> \| [`Err`](classes/Err.md)\<`a`\>

#### Type parameters

| Name |
| :------ |
| `a` |

#### Defined in

[result.ts:25](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L25)

## Functions

### ok

▸ **ok**\<`a`\>(`value`): [`Result`](modules.md#result)\<`a`\>

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `a` |

#### Returns

[`Result`](modules.md#result)\<`a`\>

#### Defined in

[result.ts:27](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L27)

___

### err

▸ **err**\<`a`\>(`error`): [`Result`](modules.md#result)\<`a`\>

#### Type parameters

| Name |
| :------ |
| `a` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `string` |

#### Returns

[`Result`](modules.md#result)\<`a`\>

#### Defined in

[result.ts:31](https://github.com/joanllenas/ts.data.json/blob/1f9abb84ecfff2ac73795d27c4f5404c78469f11/src/result.ts#L31)

# ts.data.json

![Build](https://github.com/joanllenas/ts.data.json/actions/workflows/main.yml/badge.svg)
![codecov](https://codecov.io/gh/joanllenas/ts.data.json/graph/badge.svg?token=LI9KXL4QT0)
[![npm version](https://badge.fury.io/js/ts.data.json.svg)](https://www.npmjs.com/package/ts.data.json)
[![bundle size](https://badgen.net/bundlephobia/minzip/ts.data.json)](https://bundlephobia.com/package/ts.data.json)
[![npm downloads](https://badgen.net/npm/dm/ts.data.json)](https://www.npmjs.com/package/ts.data.json)

TypeScript types vanish at runtime, so the moment JSON crosses into your app from an API, a file, or `localStorage`, those compile-time guarantees are gone. `ts.data.json` puts them back: you describe the shape you expect with a **decoder**, and it validates the data at the boundary, handing you a fully typed value or a precise error.

<p align="center">
  <a href="https://en.wikipedia.org/wiki/All_your_base_are_belong_to_us">
    <img src="assets/media/all-your-json-are-belong-to-us.jpg" alt="All your JSON are belong to us">
  </a>
</p>

## Features

- **Tiny & tree-shakeable** -- zero dependencies, ships ESM + CJS, `sideEffects: false`. You bundle only the decoders you import.
- **Rich, structured errors** -- every failure is a `{ message, path }` issue, and _all_ failures are reported at once, not just the first.
- **Standard Schema compliant** -- decoders implement the [Standard Schema](https://standardschema.dev) spec, so they drop straight into any Standard-Schema-aware tool.
- **Type inference** -- derive your static types from the decoders themselves with `FromDecoder`. No duplicate interfaces to keep in sync.

## Installation

```bash
npm install ts.data.json
```

## Quick example

One import gives you every decoder:

```ts
import * as JsonDecoder from 'ts.data.json';
```

Describe the shape you expect, then let TypeScript infer the type from it:

```ts
const userDecoder = JsonDecoder.object({
  id: JsonDecoder.number(),
  name: JsonDecoder.string(),
  roles: JsonDecoder.array(JsonDecoder.string()),
  lastLogin: JsonDecoder.nullable(JsonDecoder.string().map(iso => new Date(iso)))
});

// No separate interface needed:
type User = JsonDecoder.FromDecoder<typeof userDecoder>;
// { id: number; name: string; roles: string[]; lastLogin: Date | null }
```

Decode trusted-looking data and get back a typed value:

```ts
const result = userDecoder.decode({
  id: 123,
  name: 'Marty McFly',
  roles: ['user', 'premium'],
  lastLogin: '1985-10-26T01:21:00Z'
});

if (result.isOk()) {
  const user: User = result.value;
  console.log(`Welcome back, ${user.name}!`);
}
```

When the data is wrong, you get structured issues that point at exactly what failed:

```ts
const result = userDecoder.decode({
  id: 'not-a-number', // should be a number
  name: 'Marty McFly',
  roles: ['user', 42], // 42 should be a string
  lastLogin: null
});

if (!result.isOk()) {
  result.issues.forEach(issue => {
    console.log(`${JsonDecoder.formatIssuePath(issue.path)}: ${issue.message}`);
  });
  // id: "not-a-number" is not a valid number
  // roles[1]: 42 is not a valid string
}
```

## Documentation

Full, auto-generated API docs and guides live on the [documentation site](https://joanllenas.github.io/ts.data.json/):

- [Basic Usage](https://joanllenas.github.io/ts.data.json/latest/documents/Basic_Usage.html)
- [Advanced Usage](https://joanllenas.github.io/ts.data.json/latest/documents/Advanced_Usage.html)
- [Migrating from v2 to v3](https://joanllenas.github.io/ts.data.json/v3.0.0/documents/Migrating_to_v3.html)
- [Migrating from v3 to v4](https://joanllenas.github.io/ts.data.json/latest/documents/Migrating_to_v4.html)

New to JSON decoding? The introductory article [Decoding JSON with TypeScript](https://dev.to/joanllenas/decoding-json-with-typescript-1jjc) explains the how and why (slightly dated, but the ideas still hold).

## Related libraries

- [zod](https://github.com/colinhacks/zod)
- [valibot](https://github.com/fabian-hiller/valibot)
- [io-ts](https://github.com/gcanti/io-ts)

## License

Released under the [BSD-3-Clause](LICENSE) license.

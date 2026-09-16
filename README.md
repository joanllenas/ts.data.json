# ts.data.json

![Build](https://github.com/joanllenas/ts.data.json/actions/workflows/main.yml/badge.svg)
![codecov](https://codecov.io/gh/joanllenas/ts.data.json/graph/badge.svg?token=LI9KXL4QT0)
[![socket.dev](https://badge.socket.dev/npm/package/ts.data.json)](https://socket.dev/npm/package/ts.data.json)
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

- **Tiny & tree-shakeable** -- zero dependencies, ships ESM + CJS, `sideEffects: false`. You bundle only the decoders you import, and the [`mini` entry point](#the-mini-entry-point) drops the class wrapper for about 1 kB less.
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

## The `mini` entry point

`ts.data.json/mini` is the same library without the `Decoder` class. A decoder is a plain function `(json) => Result<T>`, and the methods become standalone imports:

```ts
import * as J from 'ts.data.json/mini';

const userDecoder = J.object({
  id: J.number(),
  name: J.string()
});

type User = J.FromDecoder<typeof userDecoder>; // { id: number; name: string }

J.decode(userDecoder, json); // Result<User>, never throws
J.parse(userDecoder, json); // User, throws on failure
J.map(J.string(), iso => new Date(iso)); // instead of .map()
```

Both entry points bundle only the decoders you import. What `mini` removes is the fixed cost of the class: its prototype and the per-instance Standard Schema property, neither of which a bundler can drop. Measured against the published build, minified and gzipped:

| What you import                             | main entry      | `mini`          |
| ------------------------------------------- | --------------- | --------------- |
| `string()` alone                            | 1457 B / 631 B  | 452 B / 269 B   |
| object + string + number + array + optional | 2562 B / 1033 B | 1451 B / 673 B  |
| the whole API                               | 6909 B / 2214 B | 6057 B / 2108 B |

So the saving is about 1 kB minified, which matters most for an app that uses only a few decoders. Reach for `mini` when you are counting bytes, and for the main entry when you prefer the chained method style.

Two things to know:

- `null` and `undefined` are exported under their own names, so a named import has to alias them: `import { null as jsonNull } from 'ts.data.json/mini'`. The namespace import above avoids this.
- `mini` exports a `Decoder<T>` type, but it is a function type, not the class. Decoders from the two entry points are not interchangeable, so pick one per project.

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

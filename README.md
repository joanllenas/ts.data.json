# ts.data.json

![Build](https://github.com/joanllenas/ts.data.json/actions/workflows/main.yml/badge.svg)
![codecov](https://codecov.io/gh/joanllenas/ts.data.json/graph/badge.svg?token=LI9KXL4QT0)
[![npm version](https://badge.fury.io/js/ts.data.json.svg)](https://www.npmjs.com/package/ts.data.json)
[![bundle size](https://badgen.net/bundlephobia/minzip/ts.data.json)](https://bundlephobia.com/package/ts.data.json)
[![npm downloads](https://img.shields.io/badge/downloads-172K%2Fmonth-blue)](https://www.npmjs.com/package/ts.data.json)

TypeScript type annotations offer compile-time guarantees. However, when data flows into our applications from external sources, various issues can still occur at runtime.

JSON decoders validate incoming JSON before it enters the application. This way, if the data has an unexpected structure, we're immediately alerted.

<p align="center">
  <a href="https://en.wikipedia.org/wiki/All_your_base_are_belong_to_us">
    <img src="assets/media/all-your-json-are-belong-to-us.jpg">
  </a>
</p>

## Documentation

The [documentation site](https://joanllenas.github.io/ts.data.json/) is auto-generated from TSDoc comments using TypeDoc.
You'll find documentation for both v2.3.1 and v3, as well as a [migration guide to v3](https://joanllenas.github.io/ts.data.json/latest/documents/Migrating_to_v3.html).

If you're new to JSON decoding, you may want to read the introductory article [Decoding JSON with TypeScript](https://dev.to/joanllenas/decoding-json-with-typescript-1jjc), which explains why and how to use this library.

## Installation

```bash
npm install ts.data.json --save
```

## Quick Example

You can play with this example in [this stackblitz playground](https://stackblitz.com/edit/ts-data-json-decoder-playground-cg13tmki?file=src%2Fmain.ts).

### One import to rule them all

```ts
import * as JsonDecoder from 'ts.data.json';
```

### Define your types

```ts
interface Address {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}
```

### Create decoders for each type

```ts
const addressDecoder = JsonDecoder.object<Address>(
  {
    street: JsonDecoder.string(),
    city: JsonDecoder.string(),
    country: JsonDecoder.string(),
    postalCode: JsonDecoder.string()
  },
  'Address'
);

const userDecoder = JsonDecoder.object(
  {
    id: JsonDecoder.number(),
    email: JsonDecoder.string(),
    name: JsonDecoder.string(),
    age: JsonDecoder.optional(JsonDecoder.number()),
    address: addressDecoder,
    tags: JsonDecoder.array(JsonDecoder.string(), 'string[]'),
    isActive: JsonDecoder.boolean(),
    lastLogin: JsonDecoder.nullable(JsonDecoder.string().map(str => new Date(str)))
  },
  'User'
);
```

### Infer your types

You can also infer the types from its decoders!

```ts
type User = JsonDecoder.FromDecoder<typeof userDecoder>;
```

### Decode a valid API response

```ts
// Valid API response
const apiResponse = {
  id: 123,
  email: 'marty@mcfly.com',
  name: 'Marty McFly',
  age: 17,
  address: {
    street: '123 Main St',
    city: 'San Francisco',
    country: 'USA',
    postalCode: '94105'
  },
  tags: ['user', 'premium'],
  isActive: true,
  lastLogin: '1985-10-26T01:21:00Z'
};

// Decode the response
userDecoder
  .decodePromise(apiResponse)
  .then((user: User) => {
    log(`Welcome back, ${user.name}!`);
    log(`Your last login was: ${user.lastLogin?.toLocaleString()}`);
  })
  .catch(error => {
    console.error('Failed to decode user data:', error);
  });
```

### Output:

```
Welcome back, Marty McFly!
Your last login was: 10/26/1985, 1:21:00 AM
```

### Decode an invalid API response

```ts
// Invalid API response
const invalidResponse = {
  id: 'not-a-number', // Should be a number
  email: 'marty@mcfly.com',
  name: 'Marty McFly',
  age: 17,
  address: {
    street: '123 Main St',
    city: 'San Francisco',
    country: 'USA',
    postalCode: '94105'
  },
  tags: ['user', 'premium'],
  isActive: true,
  lastLogin: '1985-10-26T01:21:00Z'
};

// Decode the response
userDecoder
  .decodePromise(invalidResponse)
  .then(() => {
    log('User decoded successfully');
  })
  .catch(error => {
    log(`Validation failed: ${error}`, true);
  });
```

### Output:

```
Validation failed: <User> decoder failed at key "id" with error: "not-a-number" is not a valid number
```

## Related libraries

- [zod](https://github.com/colinhacks/zod)
- [valibot](https://github.com/fabian-hiller/valibot)
- [io-ts](https://github.com/gcanti/io-ts)
- [yup](https://github.com/jquense/yup)
- [ajv](https://github.com/ajv-validator/ajv)

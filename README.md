# JsonDecoder

[![Build Status](https://travis-ci.org/joanllenas/ts.data.json.svg?branch=master)](https://travis-ci.org/joanllenas/ts.data.json)
[![npm version](https://badge.fury.io/js/ts.data.json.svg)](https://www.npmjs.com/package/ts.data.json)
[![downloads - 33k/week](https://img.shields.io/badge/downloads-33k%2Fweek-45BE1D)](https://www.npmjs.com/package/ts.data.json)

TypeScript type annotations provide compile-time guarantees. However, when data flows into our clients from external sources, many things can go wrong at runtime. 

JSON decoders validate our JSON before it enters our program. This way, if the data has an unexpected structure, we're immediately alerted.

> If you are new to JSON decoding, you may want to read the introductory article [Decoding JSON with Typescript](https://dev.to/joanllenas/decoding-json-with-typescript-1jjc) about why and how to use this library.

[![](./.github/all-your-json-are-belong-to-us.jpg)](https://en.wikipedia.org/wiki/All_your_base_are_belong_to_us)

## Installation

```bash
npm install ts.data.json --save
```

## Documentation

The complete documentation is available in the source code using TSDoc format.
You can view the documentation directly in your IDE by hovering over the `JsonDecoder` namespace or any of its methods.

### Quick Example

#### Define your types

```ts
interface Address {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  address: Address;
  tags: string[];
  isActive: boolean;
  lastLogin: Date | null;
}
```

#### Create decoders for each type

```ts
const addressDecoder = JsonDecoder.object<Address>(
  {
    street: JsonDecoder.string,
    city: JsonDecoder.string,
    country: JsonDecoder.string,
    postalCode: JsonDecoder.string
  },
  'Address'
);

const userDecoder = JsonDecoder.object<User>(
  {
    id: JsonDecoder.number,
    email: JsonDecoder.string,
    name: JsonDecoder.string,
    age: JsonDecoder.optional(JsonDecoder.number),
    address: addressDecoder,
    tags: JsonDecoder.array(JsonDecoder.string, 'string[]'),
    isActive: JsonDecoder.boolean,
    lastLogin: JsonDecoder.nullable(
      JsonDecoder.string.map(str => new Date(str))
    )
  },
  'User'
);
```

#### Decode a valid API response

```ts
// Valid API response
const apiResponse = {
  id: 123,
  email: "marty@mcfly.com",
  name: "Marty McFly",
  age: 17,
  address: {
    street: "123 Main St",
    city: "San Francisco",
    country: "USA",
    postalCode: "94105"
  },
  tags: ["user", "premium"],
  isActive: true,
  lastLogin: "1985-10-26T01:21:00Z"
};

// Decode the response
userDecoder
  .decodeToPromise(apiResponse)
  .then(user => {
    console.log(`Welcome back, ${user.name}!`);
    console.log(`Your last login was: ${user.lastLogin?.toLocaleString()}`);
  })
  .catch(error => {
    console.error('Failed to decode user data:', error);
  });
```

#### Output:

```
Welcome back, Marty McFly!
Your last login was: 10/26/1985, 1:21:00 AM
```

#### Decode an invalid API response

```ts
// Invalid API response
const invalidResponse = {
  id: "not-a-number",  // Should be a number
  email: "marty@mcfly.com",
  name: "Marty McFly",
  age: 17,
  address: {
    street: "123 Main St",
    city: "San Francisco",
    country: "USA",
    postalCode: "94105"
  },
  tags: ["user", "premium"],
  isActive: true,
  lastLogin: "1985-10-26T01:21:00Z"
};

// Decode the response
userDecoder
  .decodeToPromise(invalidResponse)
  .then(user => {
    console.log('User decoded successfully');
  })
  .catch(error => {
    console.error('Validation failed:', error);
  });
```

#### Output:

```
Validation failed: <User> decoder failed at key "id" with error: "not-a-number" is not a valid number
```

## Related libraries

- [zod](https://github.com/colinhacks/zod)
- [valibot](https://github.com/fabian-hiller/valibot)
- [io-ts](https://github.com/gcanti/io-ts)
- [yup](https://github.com/jquense/yup)
- [ajv](https://github.com/ajv-validator/ajv)

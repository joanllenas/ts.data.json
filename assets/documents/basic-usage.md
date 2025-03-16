---
title: Basic Usage
category: Guides
group: Documents
---

# Basic Usage

`ts.data.json` helps you validate JSON data at runtime with compile-time type safety. This guide will show you how to use the library effectively.

You can play with this examples in [this stackblitz playground](https://stackblitz.com/edit/ts-data-json-decoder-playground-sdv7scmu?file=src%2Fmain.ts).

## Simple Types

Let's start with the basics. Here's how to decode simple JSON values:

```typescript
import { JsonDecoder } from 'ts.data.json';

// String decoder
const nameDecoder = JsonDecoder.string;
nameDecoder.decode("John"); // Ok("John")
nameDecoder.decode(123); // Err("123 is not a valid string")

// Number decoder
const ageDecoder = JsonDecoder.number;
ageDecoder.decode(25); // Ok(25)
ageDecoder.decode("25"); // Err("\"25\" is not a valid number")

// Boolean decoder
const isActiveDecoder = JsonDecoder.boolean;
isActiveDecoder.decode(true); // Ok(true)
isActiveDecoder.decode("true"); // Err("\"true\" is not a valid boolean")
```

## Object Decoding

Most of the time, you'll work with objects. Here's how to decode them:

```typescript
// Define your type
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;  // Optional field
}

// Create a decoder
const userDecoder = JsonDecoder.object<User>(
  {
    id: JsonDecoder.number,
    name: JsonDecoder.string,
    email: JsonDecoder.string,
    age: JsonDecoder.optional(JsonDecoder.number)  // Optional field
  },
  'User'  // Helps with error messages
);

// Valid data
const validJson = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  age: 30
};

const user = await userDecoder.decodeToPromise(validJson);
console.log(`Hello ${user.name}!`); // Hello John Doe!

// Invalid data
const invalidJson = {
  id: "not-a-number",
  name: "John Doe",
  email: "john@example.com"
};

try {
  await userDecoder.decodeToPromise(invalidJson);
} catch(err) {
  log(err, true); // Error: <User> decoder failed at key "id" with error: "not-a-number" is not a valid number
}
```

## Nested Objects

For complex objects with nested structures:

```typescript
interface Address {
  street: string;
  city: string;
  country: string;
}

interface User {
  id: number;
  name: string;
  address: Address;
}

// Create decoders for nested structures
const addressDecoder = JsonDecoder.object<Address>(
  {
    street: JsonDecoder.string,
    city: JsonDecoder.string,
    country: JsonDecoder.string
  },
  'Address'
);

const userDecoder = JsonDecoder.object<User>(
  {
    id: JsonDecoder.number,
    name: JsonDecoder.string,
    address: addressDecoder  // Use the nested decoder
  },
  'User'
);


const json = {
  id: 1,
  name: "John Doe",
  address: {
    street: "123 Main St",
    city: "Boston", 
    country: "USA"
  }
};

console.log(
  await userWithAddressDecoder
    .decodeToPromise(json)
    .then((user) => `${user.name} lives in ${user.address.city}`) // John Doe lives in Boston
);
```

## Arrays

Decoding arrays of values:

```typescript
// Array of strings
const tagsDecoder = JsonDecoder.array(JsonDecoder.string, 'string[]');
tagsDecoder.decode(["typescript", "json", "decoder"]); // Ok(["typescript", "json", "decoder"])
tagsDecoder.decode(["typescript", 123, "decoder"]); // Error: <string[]> decoder failed at index \"1\" with error: 123 is not a valid string

// Array of objects
const usersDecoder = JsonDecoder.array(userDecoder, 'User[]');
await usersDecoder.decodeToPromise([
  { id: 1, name: "John", email: "john@example.com" },
  { id: 2, name: "Jane", email: "jane@example.com" }
]).then(users => users.map(user) => user.id))); // Ok([1,2])

usersDecoder.decode([
  { id: 1, name: "John" },
  { id: 2, name: "Jane", email: "jane@example.com" }
]); // Error: <User[]> decoder failed at index \"0\" with error: <User> decoder failed at key \"email\" with error: undefined is not a valid string
```

## Error Recovery

Use `failover` to provide fallback values:

```typescript
const numberOrZero = JsonDecoder.failover(
  JsonDecoder.number,
  0
);

numberOrZero.decode("not a number"); // Ok(0)
```

You can use other strategies combining other decoders:

```typescript
const statusDecoder = JsonDecoder.oneOf(
  [
    JsonDecoder.isExactly('active'),
    JsonDecoder.isExactly('inactive'),
    JsonDecoder.constant('unknown'), // always succeeds with 'unknown'
  ],
  'Status'
);
statusDecoder.decode('inactive'); // Ok('inactive')
statusDecoder.decode('zxytwqgtyb'); // Ok('unknown')
```

## Handling Results

The library uses a `Result` type to handle success and failure cases safely:

```typescript
const myUserResult: Result<User> = userDecoder.decode(validUserJson);
const uppercasedUserEmail: Result<string> = myUserResult
  .map((user) => {
    return user.email;
  })
  .map((email) => {
    return email.toUpperCase();
  });
if (uppercasedUserEmail.isOk()) { // isOk() is a type guard
  console.log(uppercasedUserEmail.value); // JOHN@EXAMPLE.COM
}
```

## Type Inference

You can use the `FromDecoder` type to infer types from decoders:

```typescript
import { FromDecoder } from 'ts.data.json';

const userDecoder = JsonDecoder.object({
  id: JsonDecoder.number,
  name: JsonDecoder.string,
  email: JsonDecoder.string
}, 'User');

// Instead of manually defining the User interface:
type User = FromDecoder<typeof userDecoder>;
// type User = { id: number; name: string; email: string }
```

## Best Practices

1. **Name Your Decoders**: Always provide a name for object decoders to get better error messages:
   ```typescript
   // Good
   const userDecoder = JsonDecoder.object(..., 'User');
   // Bad
   const userDecoder = JsonDecoder.object(..., '');
   ```

2. **Reuse Decoders**: Create reusable decoders for common patterns:
   ```typescript
   const numToStringDecoder = JsonDecoder.number.map(n => n.toString(10));
   numToStringDecoder.decode(123) // Ok("123")

   const dateDecoder = JsonDecoder.string.chain(...);
   const emailDecoder = JsonDecoder.string.chain(...);
   ```

3. **Type Safety**: Let TypeScript help you by using type annotations and inference:
   ```typescript
   const decoder = JsonDecoder.object(...);
   type User = FromDecoder<typeof decoder>;
   ```

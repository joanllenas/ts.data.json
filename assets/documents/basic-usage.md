---
title: Basic Usage
category: Guides
group: Documents
---

# Basic Usage

`ts.data.json` helps you validate JSON data at runtime with compile-time type safety. This guide will show you how to use the library effectively.

## Simple Types

Let's start with the basics. Here's how to decode simple JSON values:

```typescript
import * as JsonDecoder from 'ts.data.json';

// String decoder
const nameDecoder = JsonDecoder.string();
nameDecoder.decode('John'); // Ok({ value: 'John' })
nameDecoder.decode(123); // Err({ issues: [{ message: '123 is not a valid string', path: [] }] })

// Number decoder
const ageDecoder = JsonDecoder.number();
ageDecoder.decode(25); // Ok({ value: 25 })
ageDecoder.decode('25'); // Err({ issues: [{ message: '"25" is not a valid number', path: [] }] })

// Boolean decoder
const isActiveDecoder = JsonDecoder.boolean();
isActiveDecoder.decode(true); // Ok({ value: true })
isActiveDecoder.decode('true'); // Err({ issues: [{ message: '"true" is not a valid boolean', path: [] }] })
```

## Enums

Decode against a TypeScript `enum` with `enumeration`. A rejected value is
formatted with `JSON.stringify`, just like the other primitive decoders, so the
quoting depends on the value's type:

```typescript
enum Color {
  Red = 'red',
  Blue = 'blue'
}

const colorDecoder = JsonDecoder.enumeration<Color>(Color);
colorDecoder.decode('red'); // Ok({ value: 'red' })

// A string value keeps its quotes...
colorDecoder.decode('green');
// Err({ issues: [{ message: '"green" is not a valid enum value', path: [] }] })

// ...while a numeric value is rendered without quotes.
enum Priority {
  Low = 1,
  High = 2
}

const priorityDecoder = JsonDecoder.enumeration<Priority>(Priority);
priorityDecoder.decode(3);
// Err({ issues: [{ message: '3 is not a valid enum value', path: [] }] })
```

## Object Decoding

Most of the time, you'll work with objects. Here's how to decode them:

```typescript
// Define your type
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional field
}

// Create a decoder
const userDecoder = JsonDecoder.object<User>({
  id: JsonDecoder.number(),
  name: JsonDecoder.string(),
  email: JsonDecoder.string(),
  age: JsonDecoder.optional(JsonDecoder.number())
});

// Valid data
const validJson = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

const user = await userDecoder.decodePromise(validJson);
console.log(`Hello ${user.name}!`); // Hello John Doe!

// Invalid data -- all field errors are reported at once
const invalidJson = {
  id: 'not-a-number',
  name: 'John Doe',
  email: 'john@example.com'
};

try {
  await userDecoder.decodePromise(invalidJson);
} catch (error) {
  console.log(error.message); // 'id: "not-a-number" is not a valid number'
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
const addressDecoder = JsonDecoder.object<Address>({
  street: JsonDecoder.string(),
  city: JsonDecoder.string(),
  country: JsonDecoder.string()
});

const userDecoder = JsonDecoder.object<User>({
  id: JsonDecoder.number(),
  name: JsonDecoder.string(),
  address: addressDecoder // Use the nested decoder
});

const json = {
  id: 1,
  name: 'John Doe',
  address: {
    street: '123 Main St',
    city: 'Boston',
    country: 'USA'
  }
};

console.log(
  await userDecoder.decodePromise(json).then(user => `${user.name} lives in ${user.address.city}`) // John Doe lives in Boston
);
```

## Arrays

Decoding arrays of values:

```typescript
// Array of strings
const tagsDecoder = JsonDecoder.array(JsonDecoder.string());
tagsDecoder.decode(['typescript', 'json', 'decoder']); // Ok({ value: ["typescript", "json", "decoder"] })
tagsDecoder.decode(['typescript', 123, 'decoder']);
// Err({ issues: [{ message: '123 is not a valid string', path: [1] }] })

// Array of objects
const usersDecoder = JsonDecoder.array(userDecoder);
await usersDecoder
  .decodePromise([
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
  ])
  .then(users => users.map(user => user.id)); // [1, 2]

usersDecoder.decode([
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
]);
// Err({ issues: [{ message: 'undefined is not a valid string', path: [0, 'email'] }] })
```

## Error Recovery

Use `fallback` to provide fallback values:

```typescript
const numberOrZero = JsonDecoder.fallback(0, JsonDecoder.number());

numberOrZero.decode('not a number'); // Ok({ value: 0 })
```

You can use other strategies combining other decoders:

```typescript
const statusDecoder = JsonDecoder.oneOf([
  JsonDecoder.literal('active'),
  JsonDecoder.literal('inactive'),
  JsonDecoder.constant('unknown') // always succeeds with 'unknown'
]);
statusDecoder.decode('inactive'); // Ok({ value: 'inactive' })
statusDecoder.decode('zxytwqgtyb'); // Ok({ value: 'unknown' })
```

## Handling Results

The library uses a `Result` type to handle success and failure cases safely:

```typescript
const myUserResult: JsonDecoder.Result<User> = userDecoder.decode(validUserJson);
const uppercasedUserEmail: JsonDecoder.Result<string> = myUserResult
  .map(user => {
    return user.email;
  })
  .map(email => {
    return email.toUpperCase();
  });
// isOk() is a type guard
if (uppercasedUserEmail.isOk()) {
  console.log(uppercasedUserEmail.value); // JOHN@EXAMPLE.COM
}
```

When a decode fails, the `Err` result holds an `issues` array. Each entry contains a human-readable `message` and a `path` pointing to the failing field:

```typescript
const result = userDecoder.decode({ id: 'bad', name: 42, email: 'john@example.com' });
if (!result.isOk()) {
  result.issues.forEach(issue => {
    const location = issue.path.length > 0 ? issue.path.join('.') : 'root';
    console.log(`${location}: ${issue.message}`);
    // id: "bad" is not a valid number
    // name: 42 is not a valid string
  });
}
```

## Type Inference

You can use the `FromDecoder` type to infer types from decoders:

```typescript
import { FromDecoder } from 'ts.data.json';

const userDecoder = JsonDecoder.object({
  id: JsonDecoder.number(),
  name: JsonDecoder.string(),
  email: JsonDecoder.string()
});

// Instead of manually defining the User interface:
type User = JsonDecoder.FromDecoder<typeof userDecoder>;
// type User = { id: number; name: string; email: string }
```

## Best Practices

1. **Reuse Decoders**: Create reusable decoders for common patterns:

   ```typescript
   const numToStringDecoder = JsonDecoder.number().map(n => n.toString(10));
   numToStringDecoder.decode(123); // Ok({ value: "123" })

   const dateDecoder = JsonDecoder.string().flatMap(...);
   const emailDecoder = JsonDecoder.string().flatMap(...);
   ```

2. **Type Safety**: Let TypeScript help you by using type annotations and inference:

```typescript
   const myDecoder = JsonDecoder.object(...);
   type User = JsonDecoder.FromDecoder<typeof myDecoder>;
```

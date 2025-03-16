---
title: Advanced Usage
category: Guides
group: Documents
---

# Advanced Usage

This guide covers advanced patterns and features of `ts.data.json`. For basic usage, see the [Basic Usage](basic-usage.md) guide.

You can play with this examples in [this stackblitz playground](https://stackblitz.com/edit/ts-data-json-decoder-playground-v1wnqgi4?file=src%2Fmain.ts).

## Custom Decoders

### String Decoder

You can easily replicate the string decoder:

```typescript
const myStringDecoder: JsonDecoder.Decoder<string> = new JsonDecoder.Decoder(
  (json: unknown) => {
    if (typeof json === 'string') {
      return ok(json);
    } else {
      return err('Expected a string');
    }
  }
);

console.log(myStringDecoder.decode('Hello!')); // Ok('Hello!)
console.log(myStringDecoder.decode(123)); // Err('Expected a string')
```

### Email Decoder

Leverage built-in decoders and layer other decoders on top by following this pattern with the `chain` function.

```typescript
const emailDecoder = JsonDecoder.string.chain((email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? JsonDecoder.succeed
    : JsonDecoder.fail(`Invalid email format: ${email}`);
});
```
### Date decoder

```typescript
const dateDecoder = JsonDecoder.string.chain((str) => {
  const date = new Date(str);
  return isNaN(date.getTime())
    ? JsonDecoder.fail(`Invalid date format: ${str}`)
    : JsonDecoder.succeed;
});
```

### Range decoder

```typescript
const ageDecoder = JsonDecoder.number.chain((age) => {
  return age >= 0 && age <= 120
    ? JsonDecoder.succeed
    : JsonDecoder.fail(`Age must be between 0 and 120, got: ${age}`);
});
```

## Recursive Types

Handle recursive data structures like trees or linked lists:

```typescript
interface TreeNode {
  value: string;
  children?: TreeNode[];
}

const treeDecoder: JsonDecoder.Decoder<TreeNode> = JsonDecoder.lazy(() =>
  JsonDecoder.object<TreeNode>(
    {
      label: JsonDecoder.string,
      children: JsonDecoder.optional(
        JsonDecoder.array(treeDecoder, 'TreeNode[]')
      ),
    },
    'TreeNode'
  )
);

const tree = {
  value: "root",
  children: [
    { value: "child1" },
    { 
      value: "child2",
      children: [{ value: "grandchild" }]
    }
  ]
};

treeDecoder.decode(tree).map(node => console.log(JSON.stringify(node, null, 2))); // Ok(...)

const badTree = { ...tree, children: [...tree.children, { label: 12 }] }; 
treeDecoder.decode(badTree);
// Error: <TreeNode> decoder failed at key \"children\" with error: <TreeNode[]> decoder failed at index \"2\" with error: <TreeNode> decoder failed at key \"label\" with error: 12 is not a valid string"
```

## Union Types and Type Discrimination

Handle different object shapes based on a discriminator field:

```typescript
type Shape =
  | { type: 'circle'; radius: number }
  | { type: 'rectangle'; width: number; height: number };

const circleDecoder = JsonDecoder.object<Shape>(
  {
    type: JsonDecoder.constant('circle'),
    radius: JsonDecoder.number,
  },
  'Circle'
);

const rectangleDecoder = JsonDecoder.object<Shape>(
  {
    type: JsonDecoder.constant('rectangle'),
    width: JsonDecoder.number,
    height: JsonDecoder.number,
  },
  'Rectangle'
);

const shapeDecoder = JsonDecoder.oneOf<Shape>(
  [circleDecoder, rectangleDecoder],
  'Shape'
);

// Usage
const shapes = [
  { type: 'circle', radius: 5 },
  { type: 'rectangle', width: 10, height: 20 }
];

console.log(
  JsonDecoder.array(shapeDecoder, 'Shape[]')
    .decode(shapes)
    .map((shapes) =>
      shapes.map((shape) => {
        if (shape.type === 'circle') {
          return `Circle area: ${Math.PI * shape.radius ** 2}`;
        } else {
          return `Rectangle area: ${shape.width * shape.height}`;
        }
      })
    )
); // {"value":["Circle area: 78.53981633974483","Rectangle area: 200"]}
```

## Complex Transformations

Transform decoded data into different structures:

### Convert snake_case to camelCase

```typescript

type SnakeToCamel<S extends string> =
  S extends `${infer T}_${infer U}${infer Rest}`
    ? `${T}${Uppercase<U>}${SnakeToCamel<Rest>}`
    : S;
type CamelizedRecord<T extends Record<string, unknown>> = {
  [K in keyof T as SnakeToCamel<K & string>]: T[K];
};

function camelizeRecord<T extends Record<string, unknown>>(
  decoder: JsonDecoder.Decoder<T>
): JsonDecoder.Decoder<CamelizedRecord<T>> {
  function snakeToCamel(str: string): string {
    return str
      .toLowerCase() // Ensure lowercase input
      .replace(/[_]+([a-z])/g, (_, letter) => letter.toUpperCase()) // Convert _x → X
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  }
  return decoder.chain((record) => {
    const camelizedRecord = Object.keys(record).reduce((acc, key) => {
      const k = snakeToCamel(key);
      (acc as Record<string, unknown>)[k] = record[key];
      return acc;
    }, {} as CamelizedRecord<T>);
    return JsonDecoder.constant(camelizedRecord);
  });
}

const camelizeApiUserDecoder = camelizeRecord(
  JsonDecoder.object(
    {
      id: JsonDecoder.number,
      first_name: JsonDecoder.string,
      last_name: JsonDecoder.string,
      email_address: JsonDecoder.string,
    },
    'User'
  )
);

type User = FromDecoder<typeof camelizeApiUserDecoder>;

const apiUserJson = {
  id: 1,
  first_name: 'John', // Notice these are snake cased!
  last_name: 'Doe',
  email_address: 'john@doe.com',
};

const user: User = await camelizeApiUserDecoder.decodeToPromise(apiUserJson);
// {"id":1, "firstName":"John", "lastName":"Doe", "emailAddress":"john@doe.com"}
```

## Strict Object Validation

Ensure no extra properties exist in objects:

```typescript
interface MiniUser {
  id: number;
  name: string;
}

const strictUserDecoder = JsonDecoder.objectStrict<MiniUser>(
  {
    id: JsonDecoder.number,
    name: JsonDecoder.string,
  },
  'MiniUser'
);

// This will fail because of extra properties
strictUserDecoder.decode({
  id: 1,
  name: "John",
  extra: "field"
}); // Error: Unknown key \"extra\" found while processing strict <MiniUser> decoder
```

## Dictionary Decoding

Handle objects with dynamic keys:

```typescript
interface MiniUser {
  id: number;
  name: string;
}

// Map of user IDs to users
interface UserMap {
  [key: string]: MiniUser;
}

const userMapDecoder = JsonDecoder.dictionary(userDecoder, 'UserMap');

const users: UserMap = {
  "user1": { id: 1, name: "John" },
  "user2": { id: 2, name: "Jane" }
};

userMapDecoder.decode(users: UserMap)
  .map(userMap => {
    console.log(userMap["user1"]); // { id: 1, name: "John" }
  });
```

## Best Practices for Complex Applications

1. **Modular Decoders**: Break down complex decoders into smaller, reusable parts:
   ```typescript
   const baseUserDecoder = JsonDecoder.object({...});
   const adminUserDecoder = baseUserDecoder.chain(user => ...);
   const regularUserDecoder = baseUserDecoder.chain(user => ...);
   ```

2. **Validation Factories**: Create functions that generate common validation patterns:
   ```typescript
   const createRangeDecoder = (min: number, max: number, name: string) =>
     JsonDecoder.number.chain(n => 
       n >= min && n <= max
         ? JsonDecoder.succeed
         : JsonDecoder.fail(`${name} must be between ${min} and ${max}`)
     );

   const ageDecoder = createRangeDecoder(0, 120, 'Age');
   const percentageDecoder = createRangeDecoder(0, 100, 'Percentage');
   ```

3. **Error Context**: Add meaningful context to error messages:
   ```typescript
   const dateDecoder = JsonDecoder.string.chain((str) => {
    const date = new Date(str);
    return isNaN(date.getTime())
      ? JsonDecoder.fail(`Invalid date format: ${str}`)
      : JsonDecoder.succeed;
   });
   ```
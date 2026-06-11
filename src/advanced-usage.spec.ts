import { describe, expect, it } from 'vitest';
import { Decoder, FromDecoder } from './core';
import * as JsonDecoder from './schemas';
import { Err, err, Ok, ok, Result } from './utils/result';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const expectOk = <T>(result: Result<T>, expectedValue: T) => {
  expect(result).toBeInstanceOf(Ok);
  expect(result).toEqual(ok(expectedValue));
};

const expectErrWithIssues = <T>(
  result: Result<T>,
  expectedIssues: ReadonlyArray<{
    message: string;
    path: ReadonlyArray<string | number>;
  }>
) => {
  expect(result).toBeInstanceOf(Err);
  expect((result as Err<T>).issues).toEqual(expectedIssues);
};

// ---------------------------------------------------------------------------
// Custom Decoders
// ---------------------------------------------------------------------------

describe('advanced-usage -- custom decoders', () => {
  describe('custom string decoder', () => {
    const myStringDecoder: Decoder<string> = new Decoder((json: unknown) => {
      if (typeof json === 'string') {
        return ok(json);
      } else {
        return err([{ message: 'Expected a string', path: [] }]);
      }
    });

    it('decodes a string value', () => {
      expectOk(myStringDecoder.decode('Hello!'), 'Hello!');
    });

    it('fails with a custom message for non-string input', () => {
      expectErrWithIssues(myStringDecoder.decode(123), [
        { message: 'Expected a string', path: [] }
      ]);
    });
  });

  describe('email decoder', () => {
    const emailDecoder = JsonDecoder.string().flatMap(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email)
        ? JsonDecoder.succeed()
        : JsonDecoder.fail(`Invalid email format: ${email}`);
    });

    it('decodes a valid email address', () => {
      expectOk(emailDecoder.decode('user@example.com'), 'user@example.com');
    });

    it('fails for an invalid email format', () => {
      expectErrWithIssues(emailDecoder.decode('not-an-email'), [
        { message: 'Invalid email format: not-an-email', path: [] }
      ]);
    });
  });

  describe('date decoder', () => {
    const dateDecoder = JsonDecoder.string().flatMap(str => {
      const date = new Date(str);
      return isNaN(date.getTime())
        ? JsonDecoder.fail(`Invalid date format: ${str}`)
        : JsonDecoder.succeed();
    });

    it('decodes a valid date string', () => {
      expectOk(dateDecoder.decode('2024-01-15'), '2024-01-15');
    });

    it('fails for an invalid date string', () => {
      expectErrWithIssues(dateDecoder.decode('not-a-date'), [
        { message: 'Invalid date format: not-a-date', path: [] }
      ]);
    });
  });

  describe('range decoder', () => {
    const ageDecoder = JsonDecoder.number().flatMap(age => {
      return age >= 0 && age <= 120
        ? JsonDecoder.succeed()
        : JsonDecoder.fail(`Age must be between 0 and 120, got: ${age}`);
    });

    it('decodes a number within the valid range', () => {
      expectOk(ageDecoder.decode(25), 25);
    });

    it('fails for a number outside the valid range', () => {
      expectErrWithIssues(ageDecoder.decode(200), [
        { message: 'Age must be between 0 and 120, got: 200', path: [] }
      ]);
    });
  });
});

// ---------------------------------------------------------------------------
// Recursive Types
// ---------------------------------------------------------------------------

describe('advanced-usage -- recursive types', () => {
  interface TreeNode {
    value: string;
    children?: TreeNode[];
  }

  const treeDecoder: Decoder<TreeNode> = JsonDecoder.lazy(() =>
    JsonDecoder.object<TreeNode>({
      value: JsonDecoder.string(),
      children: JsonDecoder.optional(JsonDecoder.array(treeDecoder))
    })
  );

  const validTree = {
    value: 'root',
    children: [
      { value: 'child1' },
      {
        value: 'child2',
        children: [{ value: 'grandchild' }]
      }
    ]
  };

  it('decodes a valid tree', () => {
    expectOk(treeDecoder.decode(validTree), {
      value: 'root',
      children: [
        { value: 'child1', children: undefined },
        {
          value: 'child2',
          children: [{ value: 'grandchild', children: undefined }]
        }
      ]
    });
  });

  it('reports a deep leaf failure with the full path', () => {
    const badTree = {
      value: 'root',
      children: [
        { value: 'child1' },
        { value: 'child2' },
        { value: 12 } // bad leaf: value should be a string
      ]
    };
    expectErrWithIssues(treeDecoder.decode(badTree), [
      { message: '12 is not a valid string', path: ['children', 2, 'value'] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// Union Types and Type Discrimination
// ---------------------------------------------------------------------------

describe('advanced-usage -- union types and type discrimination', () => {
  type CircleShape = { type: 'circle'; radius: number };
  type RectangleShape = { type: 'rectangle'; width: number; height: number };

  const shapeDecoder = JsonDecoder.discriminatedUnion('type', {
    circle: JsonDecoder.object<CircleShape>({
      type: JsonDecoder.literal('circle' as const),
      radius: JsonDecoder.number()
    }),
    rectangle: JsonDecoder.object<RectangleShape>({
      type: JsonDecoder.literal('rectangle' as const),
      width: JsonDecoder.number(),
      height: JsonDecoder.number()
    })
  });

  it('decodes a circle shape', () => {
    expectOk(shapeDecoder.decode({ type: 'circle', radius: 5 }), {
      type: 'circle',
      radius: 5
    });
  });

  it('decodes a rectangle shape', () => {
    expectOk(
      shapeDecoder.decode({ type: 'rectangle', width: 10, height: 20 }),
      {
        type: 'rectangle',
        width: 10,
        height: 20
      }
    );
  });

  it('computes areas when decoding an array of shapes', () => {
    const shapes = [
      { type: 'circle', radius: 5 },
      { type: 'rectangle', width: 10, height: 20 }
    ];

    const result = JsonDecoder.array(shapeDecoder)
      .decode(shapes)
      .map(decodedShapes =>
        decodedShapes.map(shape => {
          if (shape.type === 'circle') {
            return `Circle area: ${Math.PI * shape.radius ** 2}`;
          } else {
            return `Rectangle area: ${shape.width * shape.height}`;
          }
        })
      );

    expectOk(result, ['Circle area: 78.53981633974483', 'Rectangle area: 200']);
  });

  it('reports only the matched variant failure for a bad field', () => {
    expectErrWithIssues(
      shapeDecoder.decode({ type: 'circle', radius: 'big' }),
      [{ message: '"big" is not a valid number', path: ['radius'] }]
    );
  });

  it('lists the expected tags for an unknown discriminator', () => {
    expectErrWithIssues(shapeDecoder.decode({ type: 'triangle' }), [
      {
        message:
          '"type" must be one of "circle", "rectangle", but got "triangle"',
        path: ['type']
      }
    ]);
  });
});

// ---------------------------------------------------------------------------
// Complex Transformations
// ---------------------------------------------------------------------------

describe('advanced-usage -- complex transformations', () => {
  type SnakeToCamel<S extends string> =
    S extends `${infer T}_${infer U}${infer Rest}`
      ? `${T}${Uppercase<U>}${SnakeToCamel<Rest>}`
      : S;
  type CamelizedRecord<T extends Record<string, unknown>> = {
    [K in keyof T as SnakeToCamel<K & string>]: T[K];
  };

  function camelizeRecord<T extends Record<string, unknown>>(
    decoder: Decoder<T>
  ): Decoder<CamelizedRecord<T>> {
    function snakeToCamel(str: string): string {
      return str
        .toLowerCase()
        .replace(/[_]+([a-z])/g, (_, letter: string) => letter.toUpperCase())
        .replace(/^_+|_+$/g, '');
    }
    return decoder.flatMap(record => {
      const camelizedRecord = Object.keys(record).reduce((acc, key) => {
        const k = snakeToCamel(key);
        (acc as Record<string, unknown>)[k] = record[key];
        return acc;
      }, {} as CamelizedRecord<T>);
      return JsonDecoder.constant(camelizedRecord);
    });
  }

  it('converts snake_case API keys to camelCase', async () => {
    const camelizeApiUserDecoder = camelizeRecord(
      JsonDecoder.object({
        id: JsonDecoder.number(),
        first_name: JsonDecoder.string(),
        last_name: JsonDecoder.string(),
        email_address: JsonDecoder.string()
      })
    );

    type User = FromDecoder<typeof camelizeApiUserDecoder>;

    const apiUserJson = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email_address: 'john@doe.com'
    };

    const user: User = await camelizeApiUserDecoder.decodePromise(apiUserJson);
    expect(user).toEqual({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      emailAddress: 'john@doe.com'
    });
  });
});

// ---------------------------------------------------------------------------
// Strict Object Validation
// ---------------------------------------------------------------------------

describe('advanced-usage -- strict object validation', () => {
  interface MiniUser {
    id: number;
    name: string;
  }

  const strictUserDecoder = JsonDecoder.objectStrict<MiniUser>({
    id: JsonDecoder.number(),
    name: JsonDecoder.string()
  });

  it('decodes an object with exactly the expected keys', () => {
    expectOk(strictUserDecoder.decode({ id: 1, name: 'John' }), {
      id: 1,
      name: 'John'
    });
  });

  it('fails when the object has an unknown extra key', () => {
    expectErrWithIssues(
      strictUserDecoder.decode({ id: 1, name: 'John', extra: 'field' }),
      [{ message: 'Unknown key "extra" found in strict object', path: [] }]
    );
  });
});

// ---------------------------------------------------------------------------
// Record Decoding
// ---------------------------------------------------------------------------

describe('advanced-usage -- record decoding', () => {
  interface MiniUser {
    id: number;
    name: string;
  }

  const miniUserDecoder = JsonDecoder.object<MiniUser>({
    id: JsonDecoder.number(),
    name: JsonDecoder.string()
  });

  const userMapDecoder = JsonDecoder.record(miniUserDecoder);

  it('decodes a record of users keyed by string', () => {
    const users = {
      user1: { id: 1, name: 'John' },
      user2: { id: 2, name: 'Jane' }
    };
    expectOk(userMapDecoder.decode(users), {
      user1: { id: 1, name: 'John' },
      user2: { id: 2, name: 'Jane' }
    });
  });

  it('reports a value failure with the key in the path', () => {
    const users = {
      user1: { id: 1, name: 'John' },
      user2: { id: 'bad', name: 'Jane' }
    };
    expectErrWithIssues(userMapDecoder.decode(users), [
      { message: '"bad" is not a valid number', path: ['user2', 'id'] }
    ]);
  });
});

// ---------------------------------------------------------------------------
// Best Practices -- Validation Factories
// ---------------------------------------------------------------------------

describe('advanced-usage -- validation factories', () => {
  const createRangeDecoder = (min: number, max: number, name: string) =>
    JsonDecoder.number().flatMap(n =>
      n >= min && n <= max
        ? JsonDecoder.succeed()
        : JsonDecoder.fail(`${name} must be between ${min} and ${max}`)
    );

  const ageDecoder = createRangeDecoder(0, 120, 'Age');
  const percentageDecoder = createRangeDecoder(0, 100, 'Percentage');

  it('age decoder accepts a value in range', () => {
    expectOk(ageDecoder.decode(30), 30);
  });

  it('age decoder rejects a value out of range', () => {
    expectErrWithIssues(ageDecoder.decode(200), [
      { message: 'Age must be between 0 and 120', path: [] }
    ]);
  });

  it('percentage decoder accepts a value in range', () => {
    expectOk(percentageDecoder.decode(75), 75);
  });

  it('percentage decoder rejects a value out of range', () => {
    expectErrWithIssues(percentageDecoder.decode(150), [
      { message: 'Percentage must be between 0 and 100', path: [] }
    ]);
  });
});

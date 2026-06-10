import { describe, expect, it } from 'vitest';
import * as JsonDecoder from './schemas';
import { Err, Ok, ok, type Result } from './utils/result';

// ---------------------------------------------------------------------------
// Helpers (mirrors the pattern from ts-data-json.spec.ts)
// ---------------------------------------------------------------------------

const expectOk = <T>(result: Result<T>, expectedValue: T) => {
  expect(result).toBeInstanceOf(Ok);
  expect(result).toEqual(ok(expectedValue));
};

const expectErrWithIssues = <T>(
  result: Result<T>,
  expectedIssues: ReadonlyArray<{ message: string; path: ReadonlyArray<string | number> }>
) => {
  expect(result).toBeInstanceOf(Err);
  expect((result as Err<T>).issues).toEqual(expectedIssues);
};

// ---------------------------------------------------------------------------
// Simple Types
// ---------------------------------------------------------------------------

describe('basic-usage -- simple types', () => {
  describe('string', () => {
    it('decodes a string value', () => {
      expectOk(JsonDecoder.string().decode('John'), 'John');
    });

    it('fails with an issue when the value is not a string', () => {
      expectErrWithIssues(JsonDecoder.string().decode(123), [
        { message: '123 is not a valid string', path: [] }
      ]);
    });
  });

  describe('number', () => {
    it('decodes a number value', () => {
      expectOk(JsonDecoder.number().decode(25), 25);
    });

    it('fails with an issue when the value is not a number', () => {
      expectErrWithIssues(JsonDecoder.number().decode('25'), [
        { message: '"25" is not a valid number', path: [] }
      ]);
    });
  });

  describe('boolean', () => {
    it('decodes a boolean value', () => {
      expectOk(JsonDecoder.boolean().decode(true), true);
    });

    it('fails with an issue when the value is not a boolean', () => {
      expectErrWithIssues(JsonDecoder.boolean().decode('true'), [
        { message: '"true" is not a valid boolean', path: [] }
      ]);
    });
  });
});

// ---------------------------------------------------------------------------
// Object Decoding
// ---------------------------------------------------------------------------

describe('basic-usage -- object decoding', () => {
  interface User {
    id: number;
    name: string;
    email: string;
    age?: number;
  }

  const userDecoder = JsonDecoder.object<User>({
    id: JsonDecoder.number(),
    name: JsonDecoder.string(),
    email: JsonDecoder.string(),
    age: JsonDecoder.optional(JsonDecoder.number())
  });

  it('decodes a valid user object', () => {
    expectOk(
      userDecoder.decode({ id: 1, name: 'John Doe', email: 'john@example.com', age: 30 }),
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 }
    );
  });

  it('decodes a user without the optional age field', () => {
    expectOk(
      userDecoder.decode({ id: 1, name: 'John Doe', email: 'john@example.com' }),
      { id: 1, name: 'John Doe', email: 'john@example.com', age: undefined }
    );
  });

  it('accumulates all field errors and reports them together', () => {
    expectErrWithIssues(
      userDecoder.decode({ id: 'not-a-number', name: 42, email: 'john@example.com' }),
      [
        { message: '"not-a-number" is not a valid number', path: ['id'] },
        { message: '42 is not a valid string', path: ['name'] }
      ]
    );
  });

  it('decodePromise rejects with a formatted error message', async () => {
    await expect(
      userDecoder.decodePromise({ id: 'not-a-number', name: 'John Doe', email: 'john@example.com' })
    ).rejects.toThrow('id: "not-a-number" is not a valid number');
  });
});

// ---------------------------------------------------------------------------
// Nested Objects
// ---------------------------------------------------------------------------

describe('basic-usage -- nested objects', () => {
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

  const addressDecoder = JsonDecoder.object<Address>({
    street: JsonDecoder.string(),
    city: JsonDecoder.string(),
    country: JsonDecoder.string()
  });

  const userDecoder = JsonDecoder.object<User>({
    id: JsonDecoder.number(),
    name: JsonDecoder.string(),
    address: addressDecoder
  });

  it('decodes a user with a nested address', () => {
    const json = {
      id: 1,
      name: 'John Doe',
      address: { street: '123 Main St', city: 'Boston', country: 'USA' }
    };
    expectOk(userDecoder.decode(json), {
      id: 1,
      name: 'John Doe',
      address: { street: '123 Main St', city: 'Boston', country: 'USA' }
    });
  });

  it('reports a nested field failure with its full path', () => {
    const json = {
      id: 1,
      name: 'John Doe',
      address: { street: '123 Main St', city: 42, country: 'USA' }
    };
    expectErrWithIssues(userDecoder.decode(json), [
      { message: '42 is not a valid string', path: ['address', 'city'] }
    ]);
  });

  it('resolves to "user lives in city" via decodePromise and map', async () => {
    const json = {
      id: 1,
      name: 'John Doe',
      address: { street: '123 Main St', city: 'Boston', country: 'USA' }
    };
    const result = await userDecoder
      .decodePromise(json)
      .then(user => `${user.name} lives in ${user.address.city}`);
    expect(result).toBe('John Doe lives in Boston');
  });
});

// ---------------------------------------------------------------------------
// Arrays
// ---------------------------------------------------------------------------

describe('basic-usage -- arrays', () => {
  it('decodes an array of strings', () => {
    expectOk(
      JsonDecoder.array(JsonDecoder.string()).decode(['typescript', 'json', 'decoder']),
      ['typescript', 'json', 'decoder']
    );
  });

  it('reports an element failure with its index in the path', () => {
    expectErrWithIssues(
      JsonDecoder.array(JsonDecoder.string()).decode(['typescript', 123, 'decoder']),
      [{ message: '123 is not a valid string', path: [1] }]
    );
  });

  describe('array of objects', () => {
    interface User {
      id: number;
      name: string;
      email: string;
      age?: number;
    }

    const userDecoder = JsonDecoder.object<User>({
      id: JsonDecoder.number(),
      name: JsonDecoder.string(),
      email: JsonDecoder.string(),
      age: JsonDecoder.optional(JsonDecoder.number())
    });

    const usersDecoder = JsonDecoder.array(userDecoder);

    it('decodes an array of valid user objects', async () => {
      const users = await usersDecoder.decodePromise([
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' }
      ]);
      expect(users.map(user => user.id)).toEqual([1, 2]);
    });

    it('reports a nested field failure with its index and field path', () => {
      expectErrWithIssues(
        usersDecoder.decode([
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane', email: 'jane@example.com' }
        ]),
        [{ message: 'undefined is not a valid string', path: [0, 'email'] }]
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Error Recovery
// ---------------------------------------------------------------------------

describe('basic-usage -- error recovery', () => {
  it('fallback returns the default value when decoding fails', () => {
    const numberOrZero = JsonDecoder.fallback(0, JsonDecoder.number());
    expectOk(numberOrZero.decode('not a number'), 0);
  });

  describe('oneOf with literal and constant fallback', () => {
    const statusDecoder = JsonDecoder.oneOf([
      JsonDecoder.literal('active'),
      JsonDecoder.literal('inactive'),
      JsonDecoder.constant('unknown')
    ]);

    it('decodes a known status value', () => {
      expectOk(statusDecoder.decode('inactive'), 'inactive');
      expectOk(statusDecoder.decode('active'), 'active');
    });

    it('falls back to "unknown" for unrecognised values', () => {
      expectOk(statusDecoder.decode('zxytwqgtyb'), 'unknown');
    });
  });
});

// ---------------------------------------------------------------------------
// Handling Results
// ---------------------------------------------------------------------------

describe('basic-usage -- handling results', () => {
  interface User {
    id: number;
    name: string;
    email: string;
    age?: number;
  }

  const userDecoder = JsonDecoder.object<User>({
    id: JsonDecoder.number(),
    name: JsonDecoder.string(),
    email: JsonDecoder.string(),
    age: JsonDecoder.optional(JsonDecoder.number())
  });

  it('chains map transformations on a successful result', () => {
    const validUser = { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 };
    const uppercasedEmail = userDecoder
      .decode(validUser)
      .map(user => user.email)
      .map(email => email.toUpperCase());

    expect(uppercasedEmail.isOk()).toBe(true);
    if (uppercasedEmail.isOk()) {
      expect(uppercasedEmail.value).toBe('JOHN@EXAMPLE.COM');
    }
  });

  it('accesses the issues array with path information on failure', () => {
    const result = userDecoder.decode({ id: 'bad', name: 42, email: 'john@example.com' });

    expect(result.isOk()).toBe(false);
    if (!result.isOk()) {
      expect(result.issues).toEqual([
        { message: '"bad" is not a valid number', path: ['id'] },
        { message: '42 is not a valid string', path: ['name'] }
      ]);
    }
  });

  it('map on an Err passes the issues through without calling the transform', () => {
    const result = userDecoder
      .decode({ id: 'bad', name: 'John', email: 'john@example.com' })
      .map(user => user.email);

    expect(result.isOk()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Type Inference
// ---------------------------------------------------------------------------

describe('basic-usage -- type inference', () => {
  it('FromDecoder infers the correct decoded shape at runtime', () => {
    const inlineDecoder = JsonDecoder.object({
      id: JsonDecoder.number(),
      name: JsonDecoder.string(),
      email: JsonDecoder.string()
    });

    type InferredUser = JsonDecoder.FromDecoder<typeof inlineDecoder>;

    const result = inlineDecoder.decode({ id: 1, name: 'Alice', email: 'alice@example.com' });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const user: InferredUser = result.value;
      expect(user).toEqual({ id: 1, name: 'Alice', email: 'alice@example.com' });
    }
  });
});

// ---------------------------------------------------------------------------
// Best Practices
// ---------------------------------------------------------------------------

describe('basic-usage -- best practices', () => {
  it('number().map() transforms the decoded value', () => {
    const numToStringDecoder = JsonDecoder.number().map(n => n.toString(10));
    expectOk(numToStringDecoder.decode(123), '123');
  });
});

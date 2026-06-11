/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, it } from 'vitest';
import { Decoder, FromDecoder } from './core';
import { primitiveError } from './utils/errors';
import * as JsonDecoder from './schemas';
import { Err, err, Ok, ok, Result } from './utils/result';
import type { StandardSchemaV1 } from './utils/standard-schema-v1';

// Test utils
const expectOkWithValue = <a>(result: Result<a>, expectedValue: a) => {
  expect(result).toBeInstanceOf(Ok);
  expect(result).toEqual(ok(expectedValue));
};
const expectStandardOkWithValue = <a>(
  result: StandardSchemaV1.Result<a> | Promise<StandardSchemaV1.Result<a>>,
  expectedValue: a
) => expect(result).toEqual({ value: expectedValue });
const expectErr = <a>(result: Result<a>) => expect(result).toBeInstanceOf(Err);
const expectErrWithIssues = <a>(
  result: Result<a>,
  expectedIssues: ReadonlyArray<{
    message: string;
    path: ReadonlyArray<string | number>;
  }>
) => {
  expect(result).toBeInstanceOf(Err);
  expect((result as Err<a>).issues).toEqual(expectedIssues);
};
const expectStandardErrWithIssues = <a>(
  result: StandardSchemaV1.Result<a>,
  expectedIssues: ReadonlyArray<StandardSchemaV1.Issue>
) => expect(result).toEqual({ issues: expectedIssues });

// Tests
describe('json-decoder', () => {
  // string
  describe('string', () => {
    const tag = 'string';
    it('should decode a string', () => {
      expectOkWithValue(JsonDecoder.string().decode('hi'), 'hi');
    });
    it('should decode an empty string', () => {
      expectOkWithValue(JsonDecoder.string().decode(''), '');
    });
    it('should fail if not a string', () => {
      expectErrWithIssues(
        JsonDecoder.string().decode(true),
        primitiveError(true, tag)
      );
      expectErrWithIssues(
        JsonDecoder.string().decode(undefined),
        primitiveError(undefined, tag)
      );
      expectErrWithIssues(
        JsonDecoder.string().decode(null),
        primitiveError(null, tag)
      );
    });
  });

  // number
  describe('number', () => {
    const tag = 'number';
    it('should decode a number', () => {
      expectOkWithValue(JsonDecoder.number().decode(33), 33);
      expectOkWithValue(JsonDecoder.number().decode(3.3), 3.3);
    });
    it('should fail if not a number', () => {
      expectErrWithIssues(
        JsonDecoder.number().decode('33'),
        primitiveError('33', tag)
      );
      expectErrWithIssues(
        JsonDecoder.number().decode(null),
        primitiveError(null, tag)
      );
      expectErrWithIssues(
        JsonDecoder.number().decode(undefined),
        primitiveError(undefined, tag)
      );
    });
  });

  // boolean
  describe('boolean', () => {
    const tag = 'boolean';
    it('should decode a boolean', () => {
      expectOkWithValue(JsonDecoder.boolean().decode(true), true);
      expectOkWithValue(JsonDecoder.boolean().decode(false), false);
    });
    it('should fail if not a boolean', () => {
      expectErrWithIssues(
        JsonDecoder.boolean().decode('1'),
        primitiveError('1', tag)
      );
      expectErrWithIssues(
        JsonDecoder.boolean().decode(null),
        primitiveError(null, tag)
      );
      expectErrWithIssues(
        JsonDecoder.boolean().decode(undefined),
        primitiveError(undefined, tag)
      );
    });
  });

  // null
  describe('null', () => {
    it('should decode null', () => {
      expectOkWithValue(JsonDecoder.null().decode(null), null);
    });
    it('should fail if not null', () => {
      expectErrWithIssues(JsonDecoder.null().decode(1), [
        { message: '1 is not null', path: [] }
      ]);
      expectErrWithIssues(JsonDecoder.null().decode(undefined), [
        { message: 'undefined is not null', path: [] }
      ]);
    });
  });

  // undefined
  describe('undefined', () => {
    it('should decode undefined', () => {
      expectOkWithValue(JsonDecoder.undefined().decode(undefined), undefined);
    });
    it('should fail if not undefined', () => {
      expectErrWithIssues(JsonDecoder.undefined().decode(1), [
        { message: '1 is not undefined', path: [] }
      ]);
      expectErrWithIssues(JsonDecoder.undefined().decode(null), [
        { message: 'null is not undefined', path: [] }
      ]);
    });
  });

  // enumeration
  describe('enumeration', () => {
    enum IntEnum {
      A,
      B,
      C
    }
    enum OddlyOrderedIntEnum {
      A = 2,
      B = 8,
      C = -3,
      D = 0
    }
    enum HeterogeneousEnum {
      X = 1,
      Y /* 2 */,
      Z = 'foo'
    }
    it('should decode when the value is in the enum', () => {
      expectOkWithValue(
        JsonDecoder.enumeration<IntEnum>(IntEnum).decode(1),
        IntEnum.B /* 1 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<OddlyOrderedIntEnum>(
          OddlyOrderedIntEnum
        ).decode(-3),
        OddlyOrderedIntEnum.C /* -3 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<OddlyOrderedIntEnum>(
          OddlyOrderedIntEnum
        ).decode(0),
        OddlyOrderedIntEnum.D /* 0 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<HeterogeneousEnum>(HeterogeneousEnum).decode(2),
        HeterogeneousEnum.Y /* 2 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<HeterogeneousEnum>(HeterogeneousEnum).decode(
          'foo'
        ),
        HeterogeneousEnum.Z /* 'foo' */
      );
    });
    it('should fail when the value is not in the enum', () => {
      expectErrWithIssues(JsonDecoder.enumeration<IntEnum>(IntEnum).decode(3), [
        { message: '3 is not a valid enum value', path: [] }
      ]);
      expectErrWithIssues(
        JsonDecoder.enumeration<IntEnum>(OddlyOrderedIntEnum).decode(3),
        [{ message: '3 is not a valid enum value', path: [] }]
      );
      expectErrWithIssues(
        JsonDecoder.enumeration<HeterogeneousEnum>(HeterogeneousEnum).decode(0),
        [{ message: '0 is not a valid enum value', path: [] }]
      );
    });
  });

  // fallback
  describe('fallback (on failure provide a default value)', () => {
    it('should decode a value when value is provided', () => {
      expectOkWithValue(
        JsonDecoder.fallback('', JsonDecoder.string()).decode('algo'),
        'algo'
      );
    });
    it('should return the fallback value when value is not provided', () => {
      expectOkWithValue(
        JsonDecoder.fallback('fallback value', JsonDecoder.string()).decode(44),
        'fallback value'
      );
      expectOkWithValue(
        JsonDecoder.fallback(2.1, JsonDecoder.number()).decode(null),
        2.1
      );
      expectOkWithValue(
        JsonDecoder.fallback(false, JsonDecoder.boolean()).decode(undefined),
        false
      );
    });
  });

  // succeed
  describe('succeed', () => {
    it('should accept any value', () => {
      type SomeData = {
        name: string;
        meta: any;
      };
      const someDataDecoder = JsonDecoder.object<SomeData>({
        name: JsonDecoder.string(),
        meta: JsonDecoder.succeed()
      });
      const data = {
        name: 'John',
        meta: {
          some: 'data'
        }
      };
      expectOkWithValue(someDataDecoder.decode(data), {
        name: 'John',
        meta: {
          some: 'data'
        }
      });
    });
  });

  // optional
  describe('optional', () => {
    type User = {
      firstname: string;
      lastname: string;
      email?: string;
    };

    const userDecoder = JsonDecoder.object<User>({
      firstname: JsonDecoder.string(),
      lastname: JsonDecoder.string(),
      email: JsonDecoder.optional(JsonDecoder.string())
    });
    const user = {
      firstname: 'John',
      lastname: 'Doe'
    };
    const userWithEmail = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'user@example.com'
    };

    const badUserData = {
      firstname: 2,
      lastname: 'Doe'
    };

    it('should not decode a null value', () => {
      expectErrWithIssues(
        JsonDecoder.optional(userDecoder).decode(null),
        primitiveError(null, 'object')
      );
    });

    it('should decode an undefined value', () => {
      expectOkWithValue(
        JsonDecoder.optional(userDecoder).decode(undefined),
        undefined
      );
    });

    it('should decode the value when a valid value is provided', () => {
      const expectedSuccessResult = userDecoder.decode(user);
      const result = JsonDecoder.optional(userDecoder).decode(user);

      expect(result).toEqual(expectedSuccessResult);
    });

    it('should recursively decode optional values when a valid value is provided', () => {
      const expectedSuccessResult = userDecoder.decode(userWithEmail);
      const result = JsonDecoder.optional(userDecoder).decode(userWithEmail);

      expect(result).toEqual(expectedSuccessResult);
    });

    it('should fail with message from wrapped decoder when unable to decode object', () => {
      const expectedErrorResult = userDecoder.decode(badUserData);
      const result = JsonDecoder.optional(userDecoder).decode(badUserData);

      expect(result).toEqual(expectedErrorResult);
    });
  });

  // nullable
  describe('nullable', () => {
    const nullableStringDecoder = JsonDecoder.nullable(JsonDecoder.string());

    it('should decode a null value', () => {
      expectOkWithValue(nullableStringDecoder.decode(null), null);
    });

    it('should decode an actual value', () => {
      expectOkWithValue(nullableStringDecoder.decode('a string'), 'a string');
    });

    it('should fail on undefined value', () => {
      const expectedErrorResult = JsonDecoder.string().decode(undefined);
      const result = nullableStringDecoder.decode(undefined);

      expect(result).toEqual(expectedErrorResult);
    });

    it('should fail with message from wrapped decoder when unable to decode object', () => {
      const expectedErrorResult = JsonDecoder.string().decode(1);
      const result = nullableStringDecoder.decode(1);

      expect(result).toEqual(expectedErrorResult);
    });
  });

  // oneOf
  describe('oneOf (union types)', () => {
    it('should pick the number decoder', () => {
      expectOkWithValue(
        JsonDecoder.oneOf<string | number>([
          JsonDecoder.string(),
          JsonDecoder.number()
        ]).decode(1),
        1
      );
    });
    it('should pick the string decoder', () => {
      expectOkWithValue(
        JsonDecoder.oneOf<string | number>([
          JsonDecoder.string(),
          JsonDecoder.number()
        ]).decode('hola'),
        'hola'
      );
    });
    it('should fail when no matching decoders are found', () => {
      expectErrWithIssues(
        JsonDecoder.oneOf<string | number>([
          JsonDecoder.string(),
          JsonDecoder.number()
        ]).decode(true),
        [
          { message: 'no alternative matched (tried 2)', path: [] },
          {
            message: 'true is not a valid string or true is not a valid number',
            path: []
          }
        ]
      );
    });
    it('should apply transformations', () => {
      const optionalV2 = JsonDecoder.oneOf([
        JsonDecoder.string(),
        JsonDecoder.null().map(() => undefined),
        JsonDecoder.undefined()
      ]);
      expectOkWithValue(optionalV2.decode(null), undefined);
    });
  });

  // discriminatedUnion
  describe('discriminatedUnion (tagged union types)', () => {
    type Circle = { kind: 'circle'; radius: number };
    type Square = { kind: 'square'; side: number };
    const shapeDecoder = JsonDecoder.discriminatedUnion('kind', {
      circle: JsonDecoder.object<Circle>({
        kind: JsonDecoder.literal('circle'),
        radius: JsonDecoder.number()
      }),
      square: JsonDecoder.object<Square>({
        kind: JsonDecoder.literal('square'),
        side: JsonDecoder.number()
      })
    });

    it('decodes each variant and infers the union type', () => {
      // Type assertion: the decoder produces Circle | Square.
      const _typeCheck: FromDecoder<typeof shapeDecoder> = {
        kind: 'circle',
        radius: 1
      };
      expectOkWithValue(shapeDecoder.decode({ kind: 'circle', radius: 5 }), {
        kind: 'circle',
        radius: 5
      });
      expectOkWithValue(shapeDecoder.decode({ kind: 'square', side: 4 }), {
        kind: 'square',
        side: 4
      });
    });

    it('reports the expected tags for an unknown discriminant', () => {
      expectErrWithIssues(shapeDecoder.decode({ kind: 'triangle' }), [
        {
          message:
            '"kind" must be one of "circle", "square", but got "triangle"',
          path: ['kind']
        }
      ]);
    });

    it('delegates to the matched variant on a field failure', () => {
      expectErrWithIssues(
        shapeDecoder.decode({ kind: 'circle', radius: 'x' }),
        [{ message: '"x" is not a valid number', path: ['radius'] }]
      );
    });
  });

  // allOf
  describe('allOf', () => {
    type User = { firstname: string; lastname: string; role: 'admin' | 'user' };
    const firstnameDecoder = JsonDecoder.object({
      firstname: JsonDecoder.string()
    });
    const lastnameDecoder = JsonDecoder.object({
      lastname: JsonDecoder.string()
    });
    const roleDecoder = JsonDecoder.oneOf([
      JsonDecoder.literal('admin'),
      JsonDecoder.literal('user')
    ]);
    const userDecoder: Decoder<User> = JsonDecoder.allOf([
      firstnameDecoder,
      lastnameDecoder,
      JsonDecoder.object({ role: roleDecoder })
    ]);
    it('should validate all decoders to get a user', () => {
      expectOkWithValue(
        userDecoder.decode({
          firstname: 'John',
          lastname: 'Doe',
          role: 'admin'
        }),
        { firstname: 'John', lastname: 'Doe', role: 'admin' }
      );
    });

    it('should fail when any of the provided decoders fail', () => {
      expectErrWithIssues(userDecoder.decode({ firstname: 'John' }), [
        { message: 'undefined is not a valid string', path: ['lastname'] },
        { message: 'no alternative matched (tried 2)', path: ['role'] },
        {
          message:
            'undefined is not exactly "admin" or undefined is not exactly "user"',
          path: ['role']
        }
      ]);
    });

    it('should accumulate the changes of previous decoders', () => {
      const accumulatorDeocder = JsonDecoder.allOf([
        JsonDecoder.object({ a: JsonDecoder.number() }).map(obj => ({
          a: obj.a + 1
        })),
        JsonDecoder.object({ a: JsonDecoder.number() }).map(obj => ({
          a: obj.a + 1
        }))
      ]);
      expectOkWithValue(accumulatorDeocder.decode({ a: 0 }), { a: 2 });
    });

    it('should accumulate the changes of previous decoders 2', () => {
      const upperCaseStringDecoder = new Decoder<string>((value: unknown) =>
        typeof value === 'string'
          ? ok(value.toUpperCase())
          : err([{ message: 'It is not a valid string', path: [] }])
      );
      const allOfDecoder = JsonDecoder.allOf([upperCaseStringDecoder]);
      expectOkWithValue(allOfDecoder.decode('testValue'), 'TESTVALUE');
    });

    it('should not accumulate the changes of previous decoders with arrays', () => {
      const accumulatorDeocder = JsonDecoder.allOf([
        JsonDecoder.array(
          JsonDecoder.object({ a: JsonDecoder.number() }).map(obj => ({
            a: obj.a + 1
          }))
        ),
        JsonDecoder.array(
          JsonDecoder.object({ a: JsonDecoder.number() }).map(obj => ({
            a: obj.a + 1
          }))
        )
      ]);
      expectOkWithValue(accumulatorDeocder.decode([{ a: 0 }]), [{ a: 0 }]);
    });
  });

  // object
  describe('object', () => {
    type User = {
      firstname: string;
      lastname: string;
    };

    type Payment = {
      iban: string;
      valid: boolean;
      account_holder: User;
    };

    const userDecoder = JsonDecoder.object<User>({
      firstname: JsonDecoder.string(),
      lastname: JsonDecoder.string()
    });

    it('should decode a User', () => {
      const user = {
        firstname: 'John',
        lastname: 'Doe'
      };
      expectOkWithValue(userDecoder.decode(user), {
        firstname: 'John',
        lastname: 'Doe'
      });
    });

    const paymentDecoder = JsonDecoder.object<Payment>({
      iban: JsonDecoder.string(),
      valid: JsonDecoder.boolean(),
      account_holder: userDecoder
    });

    it('should decode a Payment (with a nested User)', () => {
      const payment = {
        iban: 'ES123456789',
        valid: true,
        account_holder: {
          firstname: 'John',
          lastname: 'Doe'
        }
      };
      expectOkWithValue(paymentDecoder.decode(payment), {
        iban: 'ES123456789',
        valid: true,
        account_holder: {
          firstname: 'John',
          lastname: 'Doe'
        }
      });
    });

    it('should not include properties that are not explicitly in the decoder', () => {
      const user = {
        firstname: 'John',
        lastname: 'Doe',
        extra: true
      };
      const res = userDecoder.decode(user);
      expect(res).toBeInstanceOf(Ok);
      expect(res).not.toHaveProperty('value.extra');
      expectOkWithValue(userDecoder.decode(user), {
        firstname: 'John',
        lastname: 'Doe'
      });
      expectStandardOkWithValue(userDecoder['~standard'].validate(user), {
        firstname: 'John',
        lastname: 'Doe'
      });
    });

    it('should fail decoding when any inner decode decoder fails', () => {
      const user = {
        firstname: 2,
        lastname: true
      };
      expectErrWithIssues(userDecoder.decode(user), [
        { message: '2 is not a valid string', path: ['firstname'] },
        { message: 'true is not a valid string', path: ['lastname'] }
      ]);

      expectStandardErrWithIssues(
        userDecoder['~standard'].validate(user) as Result<User>,
        [
          { message: '2 is not a valid string', path: [{ key: 'firstname' }] },
          { message: 'true is not a valid string', path: [{ key: 'lastname' }] }
        ]
      );
    });

    it('should fail decoding when json is not an object', () => {
      expectErrWithIssues(userDecoder.decode(5), primitiveError(5, 'object'));
    });

    it('should allow decoding from different keys', () => {
      const paymentDecoderFromDifferentKeys = JsonDecoder.object<Payment>({
        iban: { fromKey: 'the_iban', decoder: JsonDecoder.string() },
        valid: JsonDecoder.boolean(),
        account_holder: userDecoder
      });

      const the_payment = {
        the_iban: 'ES123456789',
        valid: true,
        account_holder: {
          firstname: 'John',
          lastname: 'Doe'
        }
      };
      expectOkWithValue(paymentDecoderFromDifferentKeys.decode(the_payment), {
        iban: 'ES123456789',
        valid: true,
        account_holder: {
          firstname: 'John',
          lastname: 'Doe'
        }
      });
    });

    describe('objectStrict', () => {
      const strictUserDecoder = JsonDecoder.objectStrict<User>({
        firstname: JsonDecoder.string(),
        lastname: JsonDecoder.string()
      });
      it('should succeed when object has exactly all keys', () => {
        const user = {
          firstname: 'John',
          lastname: 'Doe'
        };
        expectOkWithValue(strictUserDecoder.decode(user), {
          firstname: 'John',
          lastname: 'Doe'
        });
      });
      it('should allow decoding from different keys', () => {
        const paymentDecoderFromDifferentKeys =
          JsonDecoder.objectStrict<Payment>({
            iban: { fromKey: 'the_iban', decoder: JsonDecoder.string() },
            valid: JsonDecoder.boolean(),
            account_holder: userDecoder
          });

        const the_payment = {
          the_iban: 'ES123456789',
          valid: true,
          account_holder: {
            firstname: 'John',
            lastname: 'Doe'
          }
        };
        expectOkWithValue(paymentDecoderFromDifferentKeys.decode(the_payment), {
          iban: 'ES123456789',
          valid: true,
          account_holder: {
            firstname: 'John',
            lastname: 'Doe'
          }
        });
      });
      it('should fail when object has unknown keys', () => {
        const user = {
          firstname: 'John',
          lastname: 'Doe',
          email: 'doe@johndoe.com'
        };
        expectErrWithIssues(strictUserDecoder.decode(user), [
          { message: 'Unknown key "email" found in strict object', path: [] }
        ]);
      });
      it('should fail when any decoded key fails to decode', () => {
        const user = {
          firstname: 'John',
          lastname: undefined
        };
        expectErrWithIssues(strictUserDecoder.decode(user), [
          { message: 'undefined is not a valid string', path: ['lastname'] }
        ]);
      });
      it('should fail when the provided json is not an object', () => {
        expectErrWithIssues(
          strictUserDecoder.decode('hello'),
          primitiveError('hello', 'object')
        );
      });
    });
  });

  // empty object
  describe('empty object', () => {
    it('should decode an empty object', () => {
      const json = {};
      expectOkWithValue(JsonDecoder.emptyObject().decode(json), {});
    });
    it('should fail to decode an object with properties', () => {
      const json = { a: 1 };
      expectErrWithIssues(
        JsonDecoder.emptyObject().decode(json),
        primitiveError(json, 'empty object')
      );
    });
    it('should fail to decode a non-object', () => {
      expectErrWithIssues(
        JsonDecoder.emptyObject().decode('hello'),
        primitiveError('hello', 'empty object')
      );
      expectErrWithIssues(
        JsonDecoder.emptyObject().decode(undefined),
        primitiveError(undefined, 'empty object')
      );
      expectErrWithIssues(
        JsonDecoder.emptyObject().decode(null),
        primitiveError(null, 'empty object')
      );
    });
  });

  // record
  describe('record (key / value pairs)', () => {
    type User = {
      firstname: string;
      lastname: string;
    };

    type GroupOfUsers = {
      [id: string]: User;
    };

    type Group = {
      id: number;
      users: GroupOfUsers;
    };

    const userDecoder = JsonDecoder.object<User>({
      firstname: JsonDecoder.string(),
      lastname: JsonDecoder.string()
    });
    const groupOfUsersDecoder = JsonDecoder.record<User>(userDecoder);
    const groupDecoder = JsonDecoder.object<Group>({
      id: JsonDecoder.number(),
      users: groupOfUsersDecoder
    });

    it('should decode a homogeneous record', () => {
      const group = {
        id: 2,
        users: {
          KJH764: {
            firstname: 'John',
            lastname: 'Johanson'
          },
          ASD345: {
            firstname: 'Peter',
            lastname: 'Peters'
          }
        }
      };

      expectOkWithValue(groupDecoder.decode(group), {
        id: 2,
        users: {
          KJH764: {
            firstname: 'John',
            lastname: 'Johanson'
          },
          ASD345: {
            firstname: 'Peter',
            lastname: 'Peters'
          }
        }
      });
    });

    it('should fail when the provided json is not a record', () => {
      expectErrWithIssues(
        JsonDecoder.record(JsonDecoder.number()).decode('hello'),
        primitiveError('hello', 'object')
      );
    });

    it('should fail to decode a primitive record with an invalid value', () => {
      expectErrWithIssues(
        JsonDecoder.record(JsonDecoder.number()).decode({
          a: 1,
          b: 2,
          c: null
        }),
        [{ message: 'null is not a valid number', path: ['c'] }]
      );
    });

    it('should fail to decode a record with a partial key/value pair object value', () => {
      const group = {
        id: 2,
        users: {
          KJH764: {
            firstname: 'John'
          },
          ASD345: {
            firstname: 'Peter',
            lastname: 'Peters'
          }
        }
      };

      expectErrWithIssues(groupDecoder.decode(group), [
        {
          message: 'undefined is not a valid string',
          path: ['users', 'KJH764', 'lastname']
        }
      ]);
    });
  });

  // array
  describe('array', () => {
    it('should decode a filled array', () => {
      expectOkWithValue(
        JsonDecoder.array<number>(JsonDecoder.number()).decode([1, 2, 3]),
        [1, 2, 3]
      );
    });
    it('should decode an object array', () => {
      type User = {
        firstname: string;
        lastname: string;
      };
      const userDecoder = JsonDecoder.object<User>({
        firstname: JsonDecoder.string(),
        lastname: JsonDecoder.string()
      });

      const users = [
        {
          firstname: 'John',
          lastname: 'Doe'
        },
        {
          firstname: 'David',
          lastname: 'Dow'
        }
      ];

      expectOkWithValue(
        JsonDecoder.array<User>(userDecoder).decode(users),
        users.slice()
      );
    });
    it('should decode an empty array', () => {
      expectOkWithValue(
        JsonDecoder.array<number>(JsonDecoder.number()).decode([]),
        []
      );
    });
    it('should fail to decode something other than an array', () => {
      expectErrWithIssues(
        JsonDecoder.array<number>(JsonDecoder.number()).decode('hola'),
        primitiveError('hola', 'array')
      );
    });
    it('should fail to decode null or undefined', () => {
      expectErrWithIssues(
        JsonDecoder.array<number>(JsonDecoder.number()).decode(null),
        primitiveError(null, 'array')
      );
      expectErrWithIssues(
        JsonDecoder.array<number>(JsonDecoder.number()).decode(undefined),
        primitiveError(undefined, 'array')
      );
    });
    it('should fail to decode a mixed array', () => {
      expectErrWithIssues(
        JsonDecoder.array<number>(JsonDecoder.number()).decode([1, '2']),
        [{ message: '"2" is not a valid number', path: [1] }]
      );
      expectErrWithIssues(
        JsonDecoder.array<number>(JsonDecoder.number()).decode(undefined),
        primitiveError(undefined, 'array')
      );
    });
  });

  // tuple
  describe('tuple', () => {
    it('no decoders returns empty tuple', () => {
      expectOkWithValue(JsonDecoder.tuple([]).decode([]), []);
    });
    it('should decode a [number, number] tuple', () => {
      const decoder: Decoder<[number, number]> = JsonDecoder.tuple([
        JsonDecoder.number(),
        JsonDecoder.number()
      ]);
      expectOkWithValue(decoder.decode([2, 3]), [2, 3]);
    });
    it('should decode a [number, string, number[]] tuple', () => {
      const decoder: Decoder<[number, string, number[]]> = JsonDecoder.tuple([
        JsonDecoder.number(),
        JsonDecoder.string(),
        JsonDecoder.array<number>(JsonDecoder.number())
      ]);
      expectOkWithValue(decoder.decode([2, 'foo', [3, 4, 5]]), [
        2,
        'foo',
        [3, 4, 5]
      ]);
    });
    it('should fail when the decoded value is not an array', () => {
      const decoder: Decoder<[number, string]> = JsonDecoder.tuple([
        JsonDecoder.number(),
        JsonDecoder.string()
      ]);
      expectErrWithIssues(
        decoder.decode('hello'),
        primitiveError('hello', 'tuple')
      );
    });
    it('should fail when ny of the tuplde items decoder fails', () => {
      const decoder: Decoder<[number, string]> = JsonDecoder.tuple([
        JsonDecoder.number(),
        JsonDecoder.string()
      ]);
      expectErrWithIssues(decoder.decode([1, 2]), [
        { message: '2 is not a valid string', path: [1] }
      ]);
    });
    it('should fail with a length mismatch error', () => {
      const decoder: Decoder<[number, number[]]> = JsonDecoder.tuple([
        JsonDecoder.number(),
        JsonDecoder.array<number>(JsonDecoder.number())
      ]);
      expectErrWithIssues(decoder.decode([2, 'foo', [3, 4, 5]]), [
        { message: 'tuple received 3 items but expected 2', path: [] }
      ]);
    });
  });

  // lazy
  describe('lazy (recursive decoders)', () => {
    type Node<a> = {
      value: a;
      children?: Node<a>[];
    };
    const treeDecoder: Decoder<Node<string>> = JsonDecoder.object<Node<string>>(
      {
        value: JsonDecoder.string(),
        children: JsonDecoder.oneOf<Node<string>[]>([
          JsonDecoder.lazy(() => JsonDecoder.array(treeDecoder)),
          JsonDecoder.undefined().map(() => [])
        ])
      }
    );
    const json: Node<string> = {
      value: 'root',
      children: [
        { value: '1' },
        { value: '2', children: [{ value: '2.1' }, { value: '2.2' }] },
        {
          value: '3',
          children: [
            { value: '3.1', children: [] },
            { value: '3.2', children: [{ value: '3.2.1' }] }
          ]
        }
      ]
    };
    it('should decode a recursive tree data structure', () => {
      expectOkWithValue(treeDecoder.decode(json), {
        value: 'root',
        children: [
          { value: '1', children: [] },
          {
            value: '2',
            children: [
              { value: '2.1', children: [] },
              { value: '2.2', children: [] }
            ]
          },
          {
            value: '3',
            children: [
              { value: '3.1', children: [] },
              { value: '3.2', children: [{ value: '3.2.1', children: [] }] }
            ]
          }
        ]
      });
    });
    it('should fail to decode a recursive tree data structure if any of its nodes fails', () => {
      const json2 = {
        value: 'root',
        children: [
          { value: '1' },
          { value: '2', children: [{ value: '2.1' }, { value: '2.2' }] },
          {
            value: '3',
            children: [
              { children: [] }, // required `value` property is missing
              { value: '3.2', children: [{ value: '3.2.1' }] }
            ]
          }
        ]
      };
      expectErr(treeDecoder.decode(json2));
    });
    it('should fail to decode a recursive tree data structure if the value is null or undefined', () => {
      expectErrWithIssues(
        treeDecoder.decode(null),
        primitiveError(null, 'object')
      );
      expectErrWithIssues(
        treeDecoder.decode(undefined),
        primitiveError(undefined, 'object')
      );
    });
  });

  // constant
  describe('constant (always return the provided value)', () => {
    it('should decode always to a constant value', () => {
      expectOkWithValue(
        JsonDecoder.constant('constant value').decode(999),
        'constant value'
      );
    });
    it('should decode undefined to a constant value', () => {
      expectOkWithValue(
        JsonDecoder.constant('constant value').decode(undefined),
        'constant value'
      );
    });
    it('should decode null to a constant value', () => {
      expectOkWithValue(
        JsonDecoder.constant('constant value').decode(null),
        'constant value'
      );
    });
  });

  // literal
  describe('literal (only succeed decoding when json is exactly like the provided value)', () => {
    it('should decode only if json is exactly some given value', () => {
      expectOkWithValue(JsonDecoder.literal(3.1).decode(3.1), 3.1);
      expectOkWithValue(JsonDecoder.literal(null).decode(null), null);
      expectOkWithValue(
        JsonDecoder.literal(undefined).decode(undefined),
        undefined
      );
    });
    it('should fail to decode when json is not exactly the given value', () => {
      expectErrWithIssues(JsonDecoder.literal(3.1).decode(3), [
        { message: '3 is not exactly 3.1', path: [] }
      ]);
    });
  });

  // Mixed
  describe('complex combinations', () => {
    type User = {
      firstname: string;
      lastname: string;
    };

    type Payment = {
      iban: string;
      valid: boolean;
      account_holder?: User;
    };

    type Tracking = {
      uid: string;
      ga: string;
    };

    type Session = {
      id: string;
      name: User;
      payment: Payment;
      tracking: Tracking;
      addons: Array<string>;
    };

    const session_json: any = {
      id: 'xy-12345',
      name: {
        firstname: 'John',
        lastname: 'Doe'
      },
      payment: {
        iban: 'DE123456435343434343',
        valid: false
      },
      tracking: {
        uid: '3242314-jk4jle-3124324',
        ga: 'djsakdasjdkasdkaskdl'
      },
      addons: ['foo', 'bar']
    };

    const session_json2: any = {
      id: 'xy-12345',
      name: {
        firstname: 'John',
        lastname: 'Doe'
      },
      payment: {
        iban: 'DE123456435343434343',
        valid: false,
        account_holder: {
          firstname: 'Donald',
          lastname: 'Duck'
        }
      },
      tracking: {
        uid: '3242314-jk4jle-3124324',
        ga: 'djsakdasjdkasdkaskdl'
      },
      addons: ['foo', 'bar']
    };

    const session_json_invalid: any = {
      id: 'xy-12345',
      name: {
        firstname: 'John',
        lastname: 'Doe'
      },
      payment: {
        iban: 'DE123456435343434343',
        valid: false
      },
      tracking: {
        uid: '3242314-jk4jle-3124324',
        ga: 'djsakdasjdkasdkaskdl'
      },
      addons: ['foo', 'bar', true]
    };
    const userDecoder = JsonDecoder.object<User>({
      firstname: JsonDecoder.string(),
      lastname: JsonDecoder.string()
    });
    const decodeSession: Decoder<Session> = JsonDecoder.object<Session>({
      id: JsonDecoder.string(),
      name: userDecoder,
      payment: JsonDecoder.object<Payment>({
        iban: JsonDecoder.string(),
        valid: JsonDecoder.boolean(),
        account_holder: JsonDecoder.fallback<undefined | User>(
          undefined,
          JsonDecoder.object<User>({
            firstname: JsonDecoder.string(),
            lastname: JsonDecoder.string()
          })
        )
      }),
      tracking: JsonDecoder.object<Tracking>({
        uid: JsonDecoder.string(),
        ga: JsonDecoder.string()
      }),
      addons: JsonDecoder.array(JsonDecoder.string())
    });

    it('should work', () => {
      expect(decodeSession.decode(session_json)).toBeInstanceOf(Ok);
    });

    it('should work', () => {
      expect(decodeSession.decode(session_json2)).toBeInstanceOf(Ok);
    });

    it('should not work', () => {
      expect(decodeSession.decode(session_json_invalid)).toBeInstanceOf(Err);
    });
  });

  describe('Decoder<a>', () => {
    describe('parse', () => {
      const userDecoder = JsonDecoder.object({
        firstname: JsonDecoder.string(),
        lastname: JsonDecoder.string()
      });

      it('should fail if parsing a number with a string deocder', () => {
        expect(() => JsonDecoder.string().parse(123)).toThrowError(
          '123 is not a valid string'
        );
      });

      it('should parse a valid JSON string', () => {
        expect(
          userDecoder.parse({ firstname: 'John', lastname: 'Doe' })
        ).toEqual({
          firstname: 'John',
          lastname: 'Doe'
        });
      });

      it('should fail when decoded value does not match schema', () => {
        expect(() => userDecoder.parse({ firstname: 'John' })).toThrowError(
          'lastname: undefined is not a valid string'
        );
      });
    });

    describe('decodePromise', () => {
      it('should resolve when decoding succeeds', async () => {
        expect(await JsonDecoder.string().decodePromise('hola')).toEqual(
          'hola'
        );
      });
      it('should reject when decoding fails', () => {
        JsonDecoder.string()
          .decodePromise(2)
          .catch((error: Error) => {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe(primitiveError(2, 'string')[0].message);
            expect(error.cause).toEqual(primitiveError(2, 'string'));
          });
      });
    });

    describe('map', () => {
      it('should transform a string date into a Date', () => {
        const stringToDateDecoder = JsonDecoder.string().map(
          stringDate => new Date(stringDate)
        );
        expect(
          (stringToDateDecoder.decode('2018-12-21T18:22:25.490Z') as Ok<Date>)
            .value
        ).toBeInstanceOf(Date);
      });
      it('should keep transforming based on the previous transformation value', () => {
        const decoder = JsonDecoder.array(JsonDecoder.number())
          .map(arr => arr.slice(2))
          .map(arr => arr.slice(2))
          .map(arr => arr.slice(2));
        expectOkWithValue(
          decoder.decode([1, 2, 3, 4, 5, 6, 7, 8, 9]),
          [7, 8, 9]
        );
      });
    });

    describe('flatMap', () => {
      type SquareProps = { side: number };
      type RectangleProps = { width: number; height: number };
      type Shape<T> = {
        type: string;
        properties: T;
      };

      const squareDecoder = JsonDecoder.object<Shape<SquareProps>>({
        type: JsonDecoder.string(),
        properties: JsonDecoder.object({
          side: JsonDecoder.number()
        })
      });

      const rectangleDecoder = JsonDecoder.object<Shape<RectangleProps>>({
        type: JsonDecoder.string(),
        properties: JsonDecoder.object({
          width: JsonDecoder.number(),
          height: JsonDecoder.number()
        })
      });

      const shapeDecoder = JsonDecoder.object<
        Shape<SquareProps | RectangleProps>
      >({
        type: JsonDecoder.string(),
        properties: JsonDecoder.succeed()
      }).flatMap(value => {
        switch (value.type) {
          case 'square':
            return squareDecoder;
          case 'rectangle':
            return rectangleDecoder;
          default:
            return JsonDecoder.fail<Shape<SquareProps | RectangleProps>>(
              `<Shape> does not support type "${value.type}"`
            );
        }
      });

      it('should chain Shape and Square decoders', () => {
        const square = {
          type: 'square',
          properties: {
            side: 5
          }
        };

        expectOkWithValue(shapeDecoder.decode(square), {
          type: 'square',
          properties: {
            side: 5
          }
        });
      });

      it('should chain Shape and Rectangle decoders', () => {
        const rect = {
          type: 'rectangle',
          properties: {
            width: 5,
            height: 3
          }
        };

        expectOkWithValue(shapeDecoder.decode(rect), {
          type: 'rectangle',
          properties: {
            width: 5,
            height: 3
          }
        });
      });

      it('should fail when Shape type is not supported', () => {
        const circle = {
          type: 'circle',
          properties: {
            radius: 10
          }
        };

        expectErrWithIssues(shapeDecoder.decode(circle), [
          { message: '<Shape> does not support type "circle"', path: [] }
        ]);
      });

      it('should fail when flatMap fails', () => {
        expectErrWithIssues(
          JsonDecoder.string()
            .flatMap(() => {
              return JsonDecoder.fail('Ouch!');
            })
            .decode(''),
          [{ message: 'Ouch!', path: [] }]
        );
      });

      it('should chain decoders based on previous value', () => {
        const hasLength = (len: number) => (json: any[]) =>
          new Decoder(_ => {
            if ((json as any[]).length === len) {
              return ok<any[]>(json);
            } else {
              return err<any[]>([
                {
                  message: `Array length is not ${len}, is ${json.length}`,
                  path: []
                }
              ]);
            }
          });
        const decoder = JsonDecoder.array(JsonDecoder.number())
          .map(arr => arr.slice(2))
          .flatMap(hasLength(8))
          .map(arr => arr.slice(2))
          .flatMap(hasLength(6))
          .map(arr => arr.slice(2))
          .flatMap(hasLength(4));
        expectOkWithValue(
          decoder.decode([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
          [7, 8, 9, 10]
        );
      });

      it('should chain age decoder', () => {
        const adultDecoder = JsonDecoder.number().flatMap(age =>
          age >= 18
            ? JsonDecoder.succeed()
            : JsonDecoder.fail(`Age ${age} is less than 18`)
        );
        expectOkWithValue(adultDecoder.decode(18), 18);
        expectErrWithIssues(adultDecoder.decode(17), [
          { message: 'Age 17 is less than 18', path: [] }
        ]);
      });
    });
  });

  // type checker tests
  describe('FromDecoder<D>', () => {
    it('should infer the primitive types', () => {
      type Str = FromDecoder<ReturnType<typeof JsonDecoder.string>>;
      type StrTest = Expect<Equal<Str, string>>;

      type Num = FromDecoder<ReturnType<typeof JsonDecoder.number>>;
      type NumTest = Expect<Equal<Num, number>>;

      type Bool = FromDecoder<ReturnType<typeof JsonDecoder.boolean>>;
      type BoolTest = Expect<Equal<Bool, boolean>>;

      expect(true).eql(true);
    });

    it('should infer object', () => {
      const userDecoder = JsonDecoder.object({
        name: JsonDecoder.string(),
        age: JsonDecoder.number()
      });
      type User = FromDecoder<typeof userDecoder>;
      type UserTest = Expect<Equal<User, { name: string; age: number }>>;

      expect(true).eql(true);
    });
  });

  describe('StandardSchemaV1', () => {
    async function standardValidate<T extends StandardSchemaV1>(
      schema: T,
      input: StandardSchemaV1.InferInput<T>
    ): Promise<StandardSchemaV1.InferOutput<T>> {
      let result = schema['~standard'].validate(input);
      if (result instanceof Promise) result = await result;

      // if the `issues` field exists, the validation failed
      if (result.issues) {
        throw new Error(JSON.stringify(result.issues, null, 2));
      }

      return result.value;
    }

    it('should integrate with standard schema', async () => {
      const res = await standardValidate(JsonDecoder.string(), 'hello');
      type TestType = Expect<Equal<typeof res, string>>;
      expect(res).equal('hello');
    });
  });

  describe('readme examples', () => {
    type User = {
      firstname: string;
      lastname: string;
    };

    const userDecoder = JsonDecoder.object<User>({
      firstname: JsonDecoder.string(),
      lastname: JsonDecoder.string()
    });

    it('should succeed', async () => {
      const jsonObjectOk = {
        firstname: 'Damien',
        lastname: 'Jurado'
      };
      await expect(userDecoder.decodePromise(jsonObjectOk)).resolves.toEqual({
        firstname: 'Damien',
        lastname: 'Jurado'
      });
    });

    it('should fail', async () => {
      const jsonObjectKo = {
        firstname: 'Erik',
        lastname: null
      };
      await expect(userDecoder.decodePromise(jsonObjectKo)).rejects.toThrow();
    });
  });
});

// -- Type-level testing

export type Expect<T extends true> = T;
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

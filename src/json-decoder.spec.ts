import { JsonDecoder, $JsonDecoderErrors, FromDecoder } from './json-decoder';

import * as chai from 'chai';
import { Ok, Result, Err, ok, err } from './result';

const expect = chai.expect;

// Test utils
const expectOkWithValue = <a>(result: Result<a>, expectedValue: a) =>
  expect(result).to.be.an.instanceof(Ok).and.to.deep.equal(ok(expectedValue));
const expectErr = <a>(result: Result<a>) =>
  expect(result).to.be.an.instanceof(Err);
const expectErrWithMsg = <a>(result: Result<a>, expectedErrorMsg: string) =>
  expect(result)
    .to.be.an.instanceof(Err)
    .and.to.deep.equal(err(expectedErrorMsg));

// Tests
describe('json-decoder', () => {
  // string
  describe('string', () => {
    const tag = 'string';
    it('should decode a string', () => {
      expectOkWithValue(JsonDecoder.string.decode('hi'), 'hi');
    });
    it('should decode an empty string', () => {
      expectOkWithValue(JsonDecoder.string.decode(''), '');
    });
    it('should fail if not a string', () => {
      expectErrWithMsg(
        JsonDecoder.string.decode(true),
        $JsonDecoderErrors.primitiveError(true, tag)
      );
      expectErrWithMsg(
        JsonDecoder.string.decode(undefined),
        $JsonDecoderErrors.primitiveError(undefined, tag)
      );
      expectErrWithMsg(
        JsonDecoder.string.decode(null),
        $JsonDecoderErrors.primitiveError(null, tag)
      );
    });
  });

  // number
  describe('number', () => {
    const tag = 'number';
    it('should decode a number', () => {
      expectOkWithValue(JsonDecoder.number.decode(33), 33);
      expectOkWithValue(JsonDecoder.number.decode(3.3), 3.3);
    });
    it('should fail if not a number', () => {
      expectErrWithMsg(
        JsonDecoder.number.decode('33'),
        $JsonDecoderErrors.primitiveError('33', tag)
      );
      expectErrWithMsg(
        JsonDecoder.number.decode(null),
        $JsonDecoderErrors.primitiveError(null, tag)
      );
      expectErrWithMsg(
        JsonDecoder.number.decode(undefined),
        $JsonDecoderErrors.primitiveError(undefined, tag)
      );
    });
  });

  // boolean
  describe('boolean', () => {
    const tag = 'boolean';
    it('should decode a boolean', () => {
      expectOkWithValue(JsonDecoder.boolean.decode(true), true);
      expectOkWithValue(JsonDecoder.boolean.decode(false), false);
    });
    it('should fail if not a boolean', () => {
      expectErrWithMsg(
        JsonDecoder.boolean.decode('1'),
        $JsonDecoderErrors.primitiveError('1', tag)
      );
      expectErrWithMsg(
        JsonDecoder.boolean.decode(null),
        $JsonDecoderErrors.primitiveError(null, tag)
      );
      expectErrWithMsg(
        JsonDecoder.boolean.decode(undefined),
        $JsonDecoderErrors.primitiveError(undefined, tag)
      );
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
      D = 0,
    }
    enum HeterogeneousEnum {
      X = 1,
      Y /* 2 */,
      Z = 'foo'
    }
    it('should decode when the value is in the enum', () => {
      expectOkWithValue(
        JsonDecoder.enumeration<IntEnum>(IntEnum, 'IntEnum').decode(1),
        IntEnum.B /* 1 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<OddlyOrderedIntEnum>(
          OddlyOrderedIntEnum,
          'OddlyOrderedIntEnum'
        ).decode(-3),
        OddlyOrderedIntEnum.C /* -3 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<OddlyOrderedIntEnum>(
          OddlyOrderedIntEnum,
          'OddlyOrderedIntEnum'
        ).decode(0),
        OddlyOrderedIntEnum.D /* 0 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<HeterogeneousEnum>(
          HeterogeneousEnum,
          'HeterogeneousEnum'
        ).decode(2),
        HeterogeneousEnum.Y /* 2 */
      );
      expectOkWithValue(
        JsonDecoder.enumeration<HeterogeneousEnum>(
          HeterogeneousEnum,
          'HeterogeneousEnum'
        ).decode('foo'),
        HeterogeneousEnum.Z /* 'foo' */
      );
    });
    it('should fail when the value is not in the enum', () => {
      expectErrWithMsg(
        JsonDecoder.enumeration<IntEnum>(IntEnum, 'IntEnum').decode(3),
        $JsonDecoderErrors.enumValueError('IntEnum', 3)
      );
      expectErrWithMsg(
        JsonDecoder.enumeration<IntEnum>(
          OddlyOrderedIntEnum,
          'OddlyOrderedIntEnum'
        ).decode(3),
        $JsonDecoderErrors.enumValueError('OddlyOrderedIntEnum', 3)
      );
      expectErrWithMsg(
        JsonDecoder.enumeration<HeterogeneousEnum>(
          HeterogeneousEnum,
          'HeterogeneousEnum'
        ).decode(0),
        $JsonDecoderErrors.enumValueError('HeterogeneousEnum', 0)
      );
    });
  });

  // failover
  describe('failover (on failure provide a default value)', () => {
    it('should decode a value when value is provided', () => {
      expectOkWithValue(
        JsonDecoder.failover('', JsonDecoder.string).decode('algo'),
        'algo'
      );
    });
    it('should return the failoverValue when value is not provided', () => {
      expectOkWithValue(
        JsonDecoder.failover('failover value', JsonDecoder.string).decode(44),
        'failover value'
      );
      expectOkWithValue(
        JsonDecoder.failover(2.1, JsonDecoder.number).decode(null),
        2.1
      );
      expectOkWithValue(
        JsonDecoder.failover(false, JsonDecoder.boolean).decode(undefined),
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
      const someDataDecoder = JsonDecoder.object<SomeData>(
        { name: JsonDecoder.string, meta: JsonDecoder.succeed },
        'SomeData'
      );
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

    const userDecoder = JsonDecoder.object<User>(
      {
        firstname: JsonDecoder.string,
        lastname: JsonDecoder.string,
        email: JsonDecoder.optional(JsonDecoder.string)
      },
      'User'
    );
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

    it('should decode a null value', () => {
      expectOkWithValue(
        JsonDecoder.optional(userDecoder).decode(null),
        undefined
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

      expect(result).to.deep.equal(expectedSuccessResult);
    });

    it('should recursively decode optional values when a valid value is provided', () => {
      const expectedSuccessResult = userDecoder.decode(userWithEmail);
      const result = JsonDecoder.optional(userDecoder).decode(userWithEmail);

      expect(result).to.deep.equal(expectedSuccessResult);
    });

    it('should fail with message from wrapped decoder when unable to decode object', () => {
      const expectedErrorResult = userDecoder.decode(badUserData);
      const result = JsonDecoder.optional(userDecoder).decode(badUserData);

      expect(result).to.deep.equal(expectedErrorResult);
    });
  });

  // nullable
  describe('nullable', () => {
    const nullableStringDecoder = JsonDecoder.nullable(JsonDecoder.string);

    it('should decode a null value', () => {
      expectOkWithValue(nullableStringDecoder.decode(null), null);
    });

    it('should decode an actual value', () => {
      expectOkWithValue(nullableStringDecoder.decode('a string'), 'a string');
    });

    it('should fail on undefined value', () => {
      const expectedErrorResult = JsonDecoder.string.decode(undefined);
      const result = nullableStringDecoder.decode(undefined);

      expect(result).to.deep.equal(expectedErrorResult);
    });

    it('should fail with message from wrapped decoder when unable to decode object', () => {
      const expectedErrorResult = JsonDecoder.string.decode(1);
      const result = nullableStringDecoder.decode(1);

      expect(result).to.deep.equal(expectedErrorResult);
    });
  });

  // oneOf
  describe('oneOf (union types)', () => {
    it('should pick the number decoder', () => {
      expectOkWithValue(
        JsonDecoder.oneOf<string | number>(
          [JsonDecoder.string, JsonDecoder.number],
          'string | number'
        ).decode(1),
        1
      );
    });
    it('should pick the string decoder', () => {
      expectOkWithValue(
        JsonDecoder.oneOf<string | number>(
          [JsonDecoder.string, JsonDecoder.number],
          'string | number'
        ).decode('hola'),
        'hola'
      );
    });
    it('should fail when no matching decoders are found', () => {
      expectErrWithMsg(
        JsonDecoder.oneOf<string | number>(
          [JsonDecoder.string, JsonDecoder.number],
          'string | number'
        ).decode(true),
        $JsonDecoderErrors.oneOfError('string | number', true)
      );
    });
  });

  // allOf
  describe('allOf', () => {
    it('should be equivalent to the string decoder', () => {
      expectOkWithValue(
        JsonDecoder.allOf(JsonDecoder.string).decode('hola'),
        'hola'
      );
    });
    it('should return output from the last decoder', () => {
      expectOkWithValue(
        JsonDecoder.allOf(
          JsonDecoder.string,
          JsonDecoder.failover(10, JsonDecoder.number)
        ).decode('hola'),
        10
      );
    });
    it('should fail if the first decoder fails', () => {
      expectErrWithMsg(
        JsonDecoder.allOf(JsonDecoder.string, JsonDecoder.number).decode(10),
        $JsonDecoderErrors.primitiveError(10, 'string')
      );
    });
    it('should fail if the last decoder fails', () => {
      expectErrWithMsg(
        JsonDecoder.allOf(JsonDecoder.string, JsonDecoder.number).decode('10'),
        $JsonDecoderErrors.primitiveError('10', 'number')
      );
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

    const userDecoder = JsonDecoder.object<User>(
      {
        firstname: JsonDecoder.string,
        lastname: JsonDecoder.string
      },
      'User'
    );

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

    const paymentDecoder = JsonDecoder.object<Payment>(
      {
        iban: JsonDecoder.string,
        valid: JsonDecoder.boolean,
        account_holder: userDecoder
      },
      'Payment'
    );

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
      expect(userDecoder.decode(user))
        .to.be.an.instanceof(Ok)
        .and.not.to.have.nested.property('value.extra');
      expectOkWithValue(userDecoder.decode(user), {
        firstname: 'John',
        lastname: 'Doe'
      });
    });

    it('should fail decoding when any inner decode decoder fails', () => {
      const user = {
        firstname: 2,
        lastname: true
      };
      expectErrWithMsg(
        userDecoder.decode(user),
        $JsonDecoderErrors.objectError(
          'User',
          'firstname',
          $JsonDecoderErrors.primitiveError(2, 'string')
        )
      );
    });

    it('should fail decoding when json is not an object', () => {
      expectErrWithMsg(
        userDecoder.decode(5),
        $JsonDecoderErrors.primitiveError(5, 'User')
      );
    });

    describe('with JSON key mappings', () => {
      const userDecoderWithKeyMap = JsonDecoder.object<User>(
        {
          firstname: JsonDecoder.string,
          lastname: JsonDecoder.string
        },
        'User',
        {
          firstname: 'fName',
          lastname: 'lName'
        }
      );
      it('should decode a User object with JSON key mappings', () => {
        const json = {
          fName: 'John',
          lName: 'Doe'
        };
        expectOkWithValue(userDecoderWithKeyMap.decode(json), {
          firstname: 'John',
          lastname: 'Doe'
        });
      });
      it('should fail to denode a User object with JSON key mappings any of its decoders fails', () => {
        const json = {
          fName: 5,
          lName: 'Doe'
        };

        expectErrWithMsg(
          userDecoderWithKeyMap.decode(json),
          $JsonDecoderErrors.objectJsonKeyError(
            'User',
            'firstname',
            'fName',
            $JsonDecoderErrors.primitiveError(5, 'string')
          )
        );
      });
    });

    describe('objectStrict', () => {
      const strictUserDecoder = JsonDecoder.objectStrict<User>(
        {
          firstname: JsonDecoder.string,
          lastname: JsonDecoder.string
        },
        'User'
      );
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
      it('should fail when object has unknown keys', () => {
        const user = {
          firstname: 'John',
          lastname: 'Doe',
          email: 'doe@johndoe.com'
        };
        expectErrWithMsg(
          strictUserDecoder.decode(user),
          $JsonDecoderErrors.objectStrictUnknownKeyError('User', 'email')
        );
      });
    });
  });

  // dictionary
  describe('dictionary (key / value pairs)', () => {
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

    const userDecoder = JsonDecoder.object<User>(
      {
        firstname: JsonDecoder.string,
        lastname: JsonDecoder.string
      },
      'User'
    );
    const groupOfUsersDecoder = JsonDecoder.dictionary<User>(
      userDecoder,
      'Dict<User>'
    );
    const groupDecoder = JsonDecoder.object<Group>(
      {
        id: JsonDecoder.number,
        users: groupOfUsersDecoder
      },
      'Group'
    );

    it('should decode a homogeneous dictionary', () => {
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

    it('should fail to decode a primitive dictionary with an invalid value', () => {
      expectErrWithMsg(
        JsonDecoder.dictionary(JsonDecoder.number, 'Dict<number>').decode({
          a: 1,
          b: 2,
          c: null
        }),
        $JsonDecoderErrors.dictionaryError(
          'Dict<number>',
          'c',
          $JsonDecoderErrors.primitiveError(null, 'number')
        )
      );
    });

    it('should fail to decode a dictionary with a partial key/value pair object value', () => {
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

      expectErrWithMsg(
        groupDecoder.decode(group),
        $JsonDecoderErrors.objectError(
          'Group',
          'users',
          $JsonDecoderErrors.dictionaryError(
            'Dict<User>',
            'KJH764',
            $JsonDecoderErrors.objectError(
              'User',
              'lastname',
              $JsonDecoderErrors.primitiveError(undefined, 'string')
            )
          )
        )
      );
    });
  });

  // array
  describe('array', () => {
    it('should decode a filled array', () => {
      expectOkWithValue(
        JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode([
          1, 2, 3
        ]),
        [1, 2, 3]
      );
    });
    it('should decode an object array', () => {
      type User = {
        firstname: string;
        lastname: string;
      };
      const userDecoder = JsonDecoder.object<User>(
        {
          firstname: JsonDecoder.string,
          lastname: JsonDecoder.string
        },
        'User'
      );

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
        JsonDecoder.array<User>(userDecoder, 'User[]').decode(users),
        users.slice()
      );
    });
    it('should decode an empty array', () => {
      expectOkWithValue(
        JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode([]),
        []
      );
    });
    it('should fail to decode something other than an array', () => {
      expectErrWithMsg(
        JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode(
          'hola'
        ),
        $JsonDecoderErrors.primitiveError('hola', 'array')
      );
    });
    it('should fail to decode null or undefined', () => {
      expectErrWithMsg(
        JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode(null),
        $JsonDecoderErrors.primitiveError(null, 'array')
      );
      expectErrWithMsg(
        JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode(
          undefined
        ),
        $JsonDecoderErrors.primitiveError(undefined, 'array')
      );
    });
    it('should fail to decode a mixed array', () => {
      expectErrWithMsg(
        JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode([
          1,
          '2'
        ]),
        $JsonDecoderErrors.arrayError(
          'number[]',
          1,
          $JsonDecoderErrors.primitiveError('2', 'number')
        )
      );
      expectErrWithMsg(
        JsonDecoder.array<number>(JsonDecoder.number, 'number[]').decode(
          undefined
        ),
        $JsonDecoderErrors.primitiveError(undefined, 'array')
      );
    });
  });

  // tuple
  describe('tuple', () => {
    it('no decoders returns empty tuple', () => {
      expectOkWithValue(JsonDecoder.tuple([], '[]').decode([]), []);
    });
    it('should decode a [number, number] tuple', () => {
      const decoder: JsonDecoder.Decoder<[number, number]> = JsonDecoder.tuple(
        [JsonDecoder.number, JsonDecoder.number],
        '[number, number]'
      );
      expectOkWithValue(decoder.decode([2, 3]), [2, 3]);
    });
    it('should decode a [number, string, number[]] tuple', () => {
      const decoder: JsonDecoder.Decoder<[number, string, number[]]> =
        JsonDecoder.tuple(
          [
            JsonDecoder.number,
            JsonDecoder.string,
            JsonDecoder.array<number>(JsonDecoder.number, 'number[]')
          ],
          '[number, string, number[]]'
        );
      expectOkWithValue(decoder.decode([2, 'foo', [3, 4, 5]]), [
        2,
        'foo',
        [3, 4, 5]
      ]);
    });
    it('should decode throw a length mismatch error', () => {
      const decoder: JsonDecoder.Decoder<[number, number[]]> =
        JsonDecoder.tuple(
          [
            JsonDecoder.number,
            JsonDecoder.array<number>(JsonDecoder.number, 'number[]')
          ],
          '[number, number[]]'
        );
      expectErrWithMsg(
        decoder.decode([2, 'foo', [3, 4, 5]]),
        $JsonDecoderErrors.tupleLengthMismatchError(
          '[number, number[]]',
          [0, 1, 2],
          [0, 1]
        )
      );
    });
  });

  // lazy
  describe('lazy (recursive decoders)', () => {
    type Node<a> = {
      value: a;
      children?: Node<a>[];
    };
    const treeDecoder: JsonDecoder.Decoder<Node<string>> = JsonDecoder.object<
      Node<string>
    >(
      {
        value: JsonDecoder.string,
        children: JsonDecoder.oneOf<Node<string>[]>(
          [
            JsonDecoder.lazy(() => JsonDecoder.array(treeDecoder, 'Node<a>[]')),
            JsonDecoder.isUndefined([])
          ],
          'Node<string>[] | isUndefined'
        )
      },
      'Node<string>'
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
      expectErrWithMsg(
        treeDecoder.decode(null),
        $JsonDecoderErrors.primitiveError(null, 'Node<string>')
      );
      expectErrWithMsg(
        treeDecoder.decode(undefined),
        $JsonDecoderErrors.primitiveError(undefined, 'Node<string>')
      );
    });
  });

  // isNull
  describe('isNull (only allow null values to succeed decoding)', () => {
    it('should decode a null value into a default value', () => {
      expectOkWithValue(
        JsonDecoder.isNull('default value').decode(null),
        'default value'
      );
    });
    it('should fail to decode a non null value', () => {
      expectErrWithMsg(
        JsonDecoder.isNull('default value').decode('hola'),
        $JsonDecoderErrors.nullError('hola')
      );
    });
  });

  // isUndefined
  describe('isUndefined (only allow undefined values to succeed decoding)', () => {
    it('should decode an undefined value into a default value', () => {
      expectOkWithValue(
        JsonDecoder.isUndefined('default value').decode(undefined),
        'default value'
      );
    });
    it('should fail to decode a non undefined value', () => {
      expectErrWithMsg(
        JsonDecoder.isUndefined('default value').decode('hola'),
        $JsonDecoderErrors.undefinedError('hola')
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

  // isExactly
  describe('isExactly (only succeed decoding when json is exactly like the provided value)', () => {
    it('should decode only if json is exactly some given value', () => {
      expectOkWithValue(JsonDecoder.isExactly(3.1).decode(3.1), 3.1);
      expectOkWithValue(JsonDecoder.isExactly(null).decode(null), null);
      expectOkWithValue(
        JsonDecoder.isExactly(undefined).decode(undefined),
        undefined
      );
    });
    it('should fail to decode when json is not exactly the given value', () => {
      expectErrWithMsg(
        JsonDecoder.isExactly(3.1).decode(3),
        $JsonDecoderErrors.exactlyError(3, 3.1)
      );
    });
  });

  // combine
  describe('combine', () => {
    type WithName = { name: string };
    type WithAge = { age: number };

    const nameDecoder = JsonDecoder.object<WithName>(
      { name: JsonDecoder.string },
      'WithName'
    );

    const ageDecoder = JsonDecoder.object<WithAge>(
      { age: JsonDecoder.number },
      'WithAge'
    );

    const combinedDecoder = JsonDecoder.combine(nameDecoder, ageDecoder);

    it('creates decoder that succeeds when both decoders succeed', () => {
      const data = { name: 'Alice', age: 30 };
      expectOkWithValue(combinedDecoder.decode(data), data);
    });

    it('creates decoder that fails when at least of of the decoders failed', () => {
      expectErrWithMsg(
        combinedDecoder.decode({ age: 30 }),
        `<WithName> decoder failed at key "name" with error: undefined is not a valid string`
      );

      expectErrWithMsg(
        combinedDecoder.decode({ name: 'Alice' }),
        `<WithAge> decoder failed at key "age" with error: undefined is not a valid number`
      );
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
    const userDecoder = JsonDecoder.object<User>(
      {
        firstname: JsonDecoder.string,
        lastname: JsonDecoder.string
      },
      'User'
    );
    const decodeSession: JsonDecoder.Decoder<Session> =
      JsonDecoder.object<Session>(
        {
          id: JsonDecoder.string,
          name: userDecoder,
          payment: JsonDecoder.object<Payment>(
            {
              iban: JsonDecoder.string,
              valid: JsonDecoder.boolean,
              account_holder: JsonDecoder.failover<undefined | User>(
                undefined,
                JsonDecoder.object<User>(
                  {
                    firstname: JsonDecoder.string,
                    lastname: JsonDecoder.string
                  },
                  'User'
                )
              )
            },
            'Payment'
          ),
          tracking: JsonDecoder.object<Tracking>(
            {
              uid: JsonDecoder.string,
              ga: JsonDecoder.string
            },
            'Tracking'
          ),
          addons: JsonDecoder.array(JsonDecoder.string, 'string[]')
        },
        'Session'
      );

    it('should work', () => {
      expect(decodeSession.decode(session_json)).to.be.an.instanceOf(Ok);
    });

    it('should work', () => {
      expect(decodeSession.decode(session_json2)).to.be.an.instanceOf(Ok);
    });

    it('should not work', () => {
      expect(decodeSession.decode(session_json_invalid)).to.be.an.instanceOf(
        Err
      );
    });
  });

  describe('Decoder<a>', () => {
    describe('fold', () => {
      it('should take the onErr() route when the decoder fails', () => {
        const numberToStringWithDefault = JsonDecoder.number.fold(
          (value: number) => value.toString(16),
          (error: string) => '0',
          false
        );
        expect(numberToStringWithDefault).to.equal('0');
      });
      it('should take the onOk() route when the decoder succeeds', () => {
        const stringToNumber = JsonDecoder.string.fold(
          (value: string) => parseInt(value, 10),
          (error: string) => 0,
          '000000000001'
        );
        expect(stringToNumber).to.equal(1);
      });
    });

    describe('decodeToPromise', () => {
      it('should resolve when decoding succeeds', async () => {
        expect(await JsonDecoder.string.decodeToPromise('hola')).to.equal(
          'hola'
        );
      });
      it('should reject when decoding fails', () => {
        JsonDecoder.string.decodeToPromise(2).catch(error => {
          expect(error).to.equal(
            $JsonDecoderErrors.primitiveError(2, 'string')
          );
        });
      });
    });

    describe('map', () => {
      it('should transform a string date into a Date', () => {
        const stringToDateDecoder = JsonDecoder.string.map(
          stringDate => new Date(stringDate)
        );
        expect(
          (stringToDateDecoder.decode('2018-12-21T18:22:25.490Z') as Ok<Date>)
            .value
        ).to.be.an.instanceOf(Date);
      });
      it('should keep transforming based on the previous transformation value', () => {
        const decoder = JsonDecoder.array(JsonDecoder.number, 'latLang')
          .map(arr => arr.slice(2))
          .map(arr => arr.slice(2))
          .map(arr => arr.slice(2));
        expectOkWithValue(
          decoder.decode([1, 2, 3, 4, 5, 6, 7, 8, 9]),
          [7, 8, 9]
        );
      });
    });

    describe('chain', () => {
      type SquareProps = { side: number };
      type RectangleProps = { width: number; height: number };
      type Shape<T> = {
        type: string;
        properties: T;
      };

      const squareDecoder = JsonDecoder.object<Shape<SquareProps>>(
        {
          type: JsonDecoder.string,
          properties: JsonDecoder.object(
            {
              side: JsonDecoder.number
            },
            'SquareProps'
          )
        },
        'Square'
      );

      const rectangleDecoder = JsonDecoder.object<Shape<RectangleProps>>(
        {
          type: JsonDecoder.string,
          properties: JsonDecoder.object(
            {
              width: JsonDecoder.number,
              height: JsonDecoder.number
            },
            'RectangleProps'
          )
        },
        'Square'
      );

      const shapeDecoder = JsonDecoder.object<
        Shape<SquareProps | RectangleProps>
      >(
        {
          type: JsonDecoder.string,
          properties: JsonDecoder.succeed
        },
        'Shape'
      ).chain(value => {
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

        expectErrWithMsg(
          shapeDecoder.decode(circle),
          `<Shape> does not support type "circle"`
        );
      });

      it('should chain decoders based on previous value', () => {
        const hasLength = (len: number) => (json: any[]) =>
          new JsonDecoder.Decoder(_ => {
            if ((json as any[]).length === len) {
              return ok<any[]>(json);
            } else {
              return err<any[]>(
                `Array length is not ${len}, is ${json.length}`
              );
            }
          });
        const decoder = JsonDecoder.array(JsonDecoder.number, 'latLang')
          .map(arr => arr.slice(2))
          .chain(hasLength(8))
          .map(arr => arr.slice(2))
          .chain(hasLength(6))
          .map(arr => arr.slice(2))
          .chain(hasLength(4));
        expectOkWithValue(
          decoder.decode([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
          [7, 8, 9, 10]
        );
      });

      it('should chain age decoder', () => {
        const adultDecoder = JsonDecoder.number.chain(age =>
          age >= 18
            ? JsonDecoder.succeed
            : JsonDecoder.fail(`Age ${age} is less than 18`)
        );
        expectOkWithValue(adultDecoder.decode(18), 18);
        expectErrWithMsg(adultDecoder.decode(17), 'Age 17 is less than 18');
      });
    });

    describe('mapError', () => {
      const numberWithMapErrorToNull = JsonDecoder.number.mapError(() => null);
      const numberWithMapErrorToErrorMessage = JsonDecoder.number.mapError(
        error => error
      );

      it('should decode successfully', () => {
        expectOkWithValue(numberWithMapErrorToNull.decode(9), 9);
      });

      it('should transform the value when decoding fails', () => {
        expectOkWithValue(
          numberWithMapErrorToNull.decode('not a number'),
          null
        );
      });

      it('should provide the callback function with the error message', () => {
        expectOkWithValue(
          numberWithMapErrorToErrorMessage.decode('not a number'),
          '"not a number" is not a valid number'
        );
      });
    });
  });

  describe('FromDecoder<D>', () => {
    it('should infer the primitive types', () => {
      type s = FromDecoder<typeof JsonDecoder.string>;
      const myString: s = "I'm a string!";
      type n = FromDecoder<typeof JsonDecoder.number>;
      const myNumber: n = 4;
      type b = FromDecoder<typeof JsonDecoder.boolean>;
      const myBoolean: b = true;
      expect(true).eql(true);
    });

    it('should infer object', () => {
      const userDecoder = JsonDecoder.object(
        {
          name: JsonDecoder.string,
          age: JsonDecoder.number
        },
        'User'
      );
      type User = FromDecoder<typeof userDecoder>;
      const myUser: User = {
        name: 'John Doe',
        age: 44
      };
      expect(true).eql(true);
    });
  });

  describe('readme examples', () => {
    type User = {
      firstname: string;
      lastname: string;
    };

    const userDecoder = JsonDecoder.object<User>(
      {
        firstname: JsonDecoder.string,
        lastname: JsonDecoder.string
      },
      'User'
    );

    it('should succeed', done => {
      const jsonObjectOk = {
        firstname: 'Damien',
        lastname: 'Jurado'
      };

      userDecoder
        .decodeToPromise(jsonObjectOk)
        .then(user => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it('should fail', done => {
      const jsonObjectKo = {
        firstname: 'Erik',
        lastname: null
      };

      userDecoder
        .decodeToPromise(jsonObjectKo)
        .then(user => {
          done('Unexpectedly the User decoded successfully');
        })
        .catch(error => {
          done();
        });
    });
  });
});

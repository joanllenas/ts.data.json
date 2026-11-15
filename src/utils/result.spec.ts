import { describe, expect, it } from 'vitest';
import { Ok, ok, err, type DecodingIssue } from './result';

const issue = (message: string): DecodingIssue => ({ message, path: [] });

describe('Result', () => {
  const toUpper = (str: string) => str.toUpperCase();
  const exclamation = (str: string) => `${str}!`;

  describe('Ok', () => {
    it('should wrap the value', () => {
      expect(new Ok('hola').value).to.equal('hola');
    });
    it('should chain transformations while mapping', () => {
      expect(ok('hola').map(toUpper).map(exclamation)).to.deep.equal(
        ok('HOLA!')
      );
    });
  });

  describe('Err', () => {
    it('should wrap the issues', () => {
      expect(err([issue('Wrong!')])).to.deep.equal(err([issue('Wrong!')]));
    });
    it('should keep the first error while mapping', () => {
      expect(
        err<string>([issue('Wrong')])
          .map(toUpper)
          .map(exclamation)
      ).to.deep.equal(err([issue('Wrong')]));
    });
  });

  it('should allow chaining more than one transformation', () => {
    const onlyEven = (num: number) =>
      num % 2 === 0 ? ok(num) : err<number>([issue('not even')]);
    const example = (n: number) =>
      onlyEven(n)
        .map(n2 => n2 * 2)
        .map(n2 => Number(n2).toString(16))
        .map(hex => `#${hex}`);
    expect(example(5)).to.deep.equal(err([issue('not even')]));
    expect(example(6)).to.deep.equal(ok('#c'));
  });
});

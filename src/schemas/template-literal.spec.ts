import { describe, expect, it } from 'vitest';
import { literal } from './literal';
import { number } from './number';
import { oneOf } from './one-of';
import { string } from './string';
import { templateLiteral } from './template-literal';

describe('templateLiteral', () => {
  describe('string literal', () => {
    const decoder = templateLiteral<'hi'>(['hi']);
    it('should succeed', () => {
      expect(decoder.parse('hi')).toBe('hi');
    });
    it('should fail', () => {
      expect(() => decoder.parse('bye')).toThrowError(
        '"bye" is not exactly "hi"'
      );
    });
  });

  it('should fail to decode a number', () => {
    const decoder = templateLiteral<'hi'>(['hi']);
    expect(() => decoder.parse(99)).toThrowError('99 is not exactly "hi"');
  });

  describe('prefix.${string}.suffix', () => {
    type Tpl = `prefix.${string}.suffix`;
    const decoder = templateLiteral<Tpl>(['prefix.', string(), '.suffix']);
    it('should succeed', () => {
      expect(decoder.parse('prefix.anything.suffix')).toBe(
        'prefix.anything.suffix'
      );
    });
    it('should fail', () => {
      expect(() => decoder.parse('prefix.anything')).toThrowError(
        '"prefix.anything" is not exactly "prefix.?.suffix"'
      );
    });
  });

  describe(`100px via [100, 'px']`, () => {
    const decoder = templateLiteral<'100px'>([100, 'px']);
    it('should succeed', () => {
      expect(decoder.parse('100px')).toBe('100px');
    });
    it('should fail providing 100rem', () => {
      expect(() => decoder.parse('100rem')).toThrowError(
        '"100rem" is not exactly "100px"'
      );
    });
    it('should fail providing 99px', () => {
      expect(() => decoder.parse('99px')).toThrowError(
        '"99px" is not exactly "100px"'
      );
    });
  });

  describe('${number}px', () => {
    it('should succeed', () => {
      type Tpl = `${number}px`;
      const decoder = templateLiteral<Tpl>([number(), 'px']);
      expect(decoder.parse('100px')).toBe('100px');
      expect(decoder.parse('1px')).toBe('1px');
    });
    it('should fail', () => {
      type Tpl = `${number}px`;
      const decoder = templateLiteral<Tpl>([number(), 'px']);
      expect(() => decoder.parse(2)).toThrowError('2 is not exactly "?px"');
    });
  });

  // FIXME: how to allow various decoders one after the other???
  it('should decode template with number decoder and a oneOf decoder', () => {
    type Unit = `${number}.${'px' | 'rem'}`;
    const decoder = templateLiteral<Unit>([
      number(),
      '.',
      oneOf([literal('px'), literal('rem')], 'px | rem')
    ]);
    expect(decoder.parse('100.px')).toBe('100.px');
  });
});

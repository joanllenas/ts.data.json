// A type has no runtime presence, so `entry-surface.spec.ts` cannot detect a dropped type.
// Each member below stops compiling when its type export is removed or renamed.

import * as J from './index';
import * as M from './mini';

export type MainTypeSurface = {
  Decoder: J.Decoder<string>;
  FromDecoder: J.FromDecoder<J.Decoder<number>>;
  Result: J.Result<number>;
  DecodingIssue: J.DecodingIssue;
  DecoderObject: J.DecoderObject<{ a: string }>;
  DecoderObjectStrict: J.DecoderObjectStrict<{ a: string }>;
  DecoderOutput: J.DecoderOutput<J.Decoder<boolean>>;
  TupleOfResults: J.TupleOfResults<[J.Decoder<number>]>;
  AllOfOutput: J.AllOfOutput<[J.Decoder<{ a: number }>]>;
  UnionToIntersection: J.UnionToIntersection<{ a: 1 } | { b: 2 }>;
  EmptyObject: J.EmptyObject;
};

export type MiniTypeSurface = {
  Decoder: M.Decoder<string>;
  FromDecoder: M.FromDecoder<M.Decoder<number>>;
  Result: M.Result<number>;
  DecodingIssue: M.DecodingIssue;
  DecoderObject: M.DecoderObject<{ a: string }>;
  DecoderObjectStrict: M.DecoderObjectStrict<{ a: string }>;
  DecoderOutput: M.DecoderOutput<M.Decoder<boolean>>;
  TupleOfResults: M.TupleOfResults<[M.Decoder<number>]>;
  AllOfOutput: M.AllOfOutput<[M.Decoder<{ a: number }>]>;
  UnionToIntersection: M.UnionToIntersection<{ a: 1 } | { b: 2 }>;
  EmptyObject: M.EmptyObject;
};

// The two Decoder types are deliberately not interchangeable, which is the claim
// README.md makes. If a future version makes them compatible, these two lines stop
// erroring and that README section has to be revisited.
// @ts-expect-error a mini decoder is a plain function, not the class
export const miniIsNotMain: J.Decoder<string> = M.string();
// @ts-expect-error a class instance is not callable
export const mainIsNotMini: M.Decoder<string> = J.string();

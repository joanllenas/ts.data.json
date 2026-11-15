// Checked by `src/entry-surface.spec.ts` and `test/package/package-contract.spec.ts`.
// Hand-written on purpose. When you edit a list, decide whether the change is a major.

/** Runtime exports of `ts.data.json`. */
export const MAIN_EXPORTS = [
  'Decoder',
  'Err',
  'Ok',
  'allOf',
  'array',
  'boolean',
  'constant',
  'discriminatedUnion',
  'emptyObject',
  'enumeration',
  'err',
  'fail',
  'fallback',
  'formatIssuePath',
  'lazy',
  'literal',
  'null',
  'nullValue',
  'nullable',
  'number',
  'object',
  'objectStrict',
  'ok',
  'oneOf',
  'optional',
  'record',
  'string',
  'succeed',
  'tuple',
  'undefined',
  'undefinedValue'
] as const;

/** Runtime exports of `ts.data.json/mini`. */
export const MINI_EXPORTS = [
  'Err',
  'Ok',
  'allOf',
  'array',
  'boolean',
  'constant',
  'decode',
  'decodePromise',
  'discriminatedUnion',
  'emptyObject',
  'enumeration',
  'err',
  'fail',
  'fallback',
  'flatMap',
  'formatIssuePath',
  'lazy',
  'literal',
  'map',
  'nullValue',
  'nullable',
  'number',
  'object',
  'objectStrict',
  'ok',
  'oneOf',
  'optional',
  'parse',
  'record',
  'string',
  'succeed',
  'toStandardSchema',
  'tuple',
  'undefinedValue'
] as const;

/** Names the main entry has and mini does not, on purpose. The value is the reason. */
export const ONLY_IN_MAIN: Readonly<Record<string, string>> = {
  Decoder: 'mini exports a Decoder type, so the class is main-only by design',
  null: 'deprecated alias kept for 4.x compatibility in the main entry only, removed in 5.0.0',
  undefined:
    'deprecated alias kept for 4.x compatibility in the main entry only, removed in 5.0.0'
};

/** Names mini has and the main entry does not, on purpose. */
export const ONLY_IN_MINI: Readonly<Record<string, string>> = {
  decode: 'standalone form of Decoder#decode',
  parse: 'standalone form of Decoder#parse',
  decodePromise: 'standalone form of Decoder#decodePromise',
  map: 'standalone form of Decoder#map',
  flatMap: 'standalone form of Decoder#flatMap',
  toStandardSchema:
    'the main entry exposes Standard Schema as the ~standard property on the class'
};

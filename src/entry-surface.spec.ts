import { describe, expect, it } from 'vitest';
import * as main from './index';
import * as mini from './mini';
import {
  MAIN_EXPORTS,
  MINI_EXPORTS,
  ONLY_IN_MAIN,
  ONLY_IN_MINI
} from '../test/expected-exports';

const namesOf = (mod: object) =>
  Object.keys(mod)
    .filter(name => name !== 'default' && name !== '__esModule')
    .sort();

const mainNames = namesOf(main);
const miniNames = namesOf(mini);

describe('entry point surface', () => {
  it('the main entry exports exactly the documented names', () => {
    expect(mainNames).toEqual([...MAIN_EXPORTS].sort());
  });

  it('the mini entry exports exactly the documented names', () => {
    expect(miniNames).toEqual([...MINI_EXPORTS].sort());
  });

  it('no name exists in one entry only, unless it is allowlisted with a reason', () => {
    const inMain = new Set(mainNames);
    const inMini = new Set(miniNames);
    expect(
      mainNames.filter(name => !inMini.has(name) && !(name in ONLY_IN_MAIN))
    ).toEqual([]);
    expect(
      miniNames.filter(name => !inMain.has(name) && !(name in ONLY_IN_MINI))
    ).toEqual([]);
  });

  it('the allowlists have no stale entries', () => {
    // An allowlisted name must really be in one entry and really be missing from the
    // other, otherwise it is a leftover from an earlier refactor.
    const inMain = new Set(mainNames);
    const inMini = new Set(miniNames);
    expect(
      Object.keys(ONLY_IN_MAIN).filter(
        name => !inMain.has(name) || inMini.has(name)
      )
    ).toEqual([]);
    expect(
      Object.keys(ONLY_IN_MINI).filter(
        name => !inMini.has(name) || inMain.has(name)
      )
    ).toEqual([]);
  });
});

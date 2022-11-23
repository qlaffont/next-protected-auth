/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';

import { currentURLIsAllowed } from '../src/currentURLIsAllowed';

describe('currentUrlIsAllowed', () => {
  it('should validate url with method', async () => {
    const config = ['/test'];

    expect(currentURLIsAllowed('/test', config)).toBe(true);
  });

  it('should validate url with slash at the end', async () => {
    const config = ['/test'];

    expect(currentURLIsAllowed('/test/', config)).toBe(true);
  });

  it('should validate url with # at the end', async () => {
    const config = ['/test'];

    expect(currentURLIsAllowed('/test#id', config)).toBe(true);
  });

  it('should validate url with any at the end', async () => {
    const config = ['/test/*'];

    expect(currentURLIsAllowed('/test/ceciestyntest', config)).toBe(true);
  });

  it('should validate with several param', async () => {
    const config = ['/test/:test2/:test3/test'];

    expect(currentURLIsAllowed('/test/:test2/:test3/test', config)).toBe(true);

    expect(currentURLIsAllowed('/test/:test2/:test3/wrong', config)).toBe(
      false
    );
  });
});

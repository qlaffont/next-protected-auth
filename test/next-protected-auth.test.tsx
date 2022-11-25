/* eslint-disable @typescript-eslint/ban-ts-comment */
import '@testing-library/jest-dom';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  act,
  cleanup,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react';
import React from 'react';

import {
  getAccessToken,
  getAndSaveAccessToken,
  NextAuthProtectedCallback,
  NextAuthProtectedLogin,
  NextAuthProtectedLogout,
  NextAuthProvider,
  removeAccessToken,
  useNextAuthProtected,
  useNextAuthProtectedHandler,
} from '../src';

describe('next-protected-auth', () => {
  it('works', () => {
    expect(NextAuthProtectedCallback).toBeDefined();
    expect(NextAuthProtectedLogin).toBeDefined();
    expect(NextAuthProtectedLogout).toBeDefined();
    expect(useNextAuthProtectedHandler).toBeDefined();
  });

  describe('getAndSaveAccessToken', () => {
    beforeEach(() => {
      localStorage.removeItem('accessToken');
    });

    it('should be able to save accessToken if provided', async () => {
      await getAndSaveAccessToken({ accessToken: 'true' });

      expect(localStorage.getItem('accessToken')).toBe('"true"');
    });

    it('should be able to do nothing if no param', async () => {
      await getAndSaveAccessToken({});

      expect(localStorage.getItem('accessToken')).not.toBe('"true"');
    });

    it('should be able to execute renewTokenFct', async () => {
      const renewTokenFct = jest.fn(() => 'toto');
      //@ts-ignore
      await getAndSaveAccessToken({ renewTokenFct });

      expect(renewTokenFct).toHaveBeenCalled();
      expect(localStorage.getItem('accessToken')).toBe('"toto"');
    });
  });

  describe('getAccessToken', () => {
    beforeEach(() => {
      localStorage.removeItem('accessToken');
    });

    it('should be able to fetch accessToken if provided', async () => {
      localStorage.setItem('accessToken', '"toto"');

      expect(getAccessToken()).toBe('toto');
    });
  });

  describe('removeAccessToken', () => {
    beforeEach(() => {
      localStorage.removeItem('accessToken');
    });

    it('should be able to fetch accessToken if provided', async () => {
      localStorage.setItem('accessToken', 'toto');

      removeAccessToken();

      expect(getAccessToken()).toBe(undefined);
    });
  });

  describe('NextAuthProtectedLogin', () => {
    beforeEach(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('redirectURL');
    });

    afterEach(() => {
      cleanup();
    });

    it('should be able to execute call callback at the end', () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = { push: jest.fn(), query: {} };
      useRouter.mockReturnValue(router);

      console.log = jest.fn();

      const Cmp = NextAuthProtectedLogin({
        callback: () => {
          console.log('hello');
        },
        authCallbackURL: '/auth',
      });

      render(<Cmp />);

      expect(console.log).toHaveBeenCalledWith('hello');
    });

    it('should be able to save redirectURL if redirect is precised', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          toString: () =>
            `http://localhost/?redirectURL=${encodeURIComponent('test')}`,
        },
      });

      console.log = jest.fn();

      localStorage.removeItem('accessToken');
      const Cmp = NextAuthProtectedLogin({
        callback: async () => {
          console.log('hello');
        },
        authCallbackURL: '/auth',
      });

      render(<Cmp />);

      expect(localStorage.getItem('redirectURL')).toBe(`"test"`);
    });

    it('should be able to redirect to callback if accessToken is existing', () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = { push: jest.fn(), query: { redirectURL: 'test' } };
      useRouter.mockReturnValue(router);

      localStorage.setItem('accessToken', '"test"');

      const Cmp = NextAuthProtectedLogin({
        callback: () => {
          console.log('hello');
        },
        authCallbackURL: '/auth',
      });

      render(<Cmp />);

      expect(router.push).toHaveBeenCalledWith('/auth');
    });
  });

  describe('NextAuthProtectedLogout', () => {
    //@ts-ignore
    let container;

    beforeEach(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('redirectURL');
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      //@ts-ignore
      document.body.removeChild(container);
      container = null;
      cleanup();
    });

    it('should be able to execute call callback at the end and preCallback at the beginning', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = { push: jest.fn(), query: {} };
      useRouter.mockReturnValue(router);

      console.log = jest.fn();

      const Cmp = NextAuthProtectedLogout({
        preCallback: () => {
          console.log('pre-hello');
        },
        callback: () => {
          console.log('hello');
        },
      });

      act(() => {
        render(<Cmp />);
      });

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledTimes(2);
        expect(console.log).toHaveBeenCalledWith('pre-hello');
        expect(console.log).toHaveBeenCalledWith('hello');
      });
    });
  });

  describe('NextAuthProtectedCallback', () => {
    //@ts-ignore
    let container;

    beforeEach(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('redirectURL');
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      //@ts-ignore
      document.body.removeChild(container);
      container = null;
      cleanup();
    });

    it('should be able to execute noTokenCallback', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = { push: jest.fn(), query: {} };
      useRouter.mockReturnValue(router);
      console.log = jest.fn();

      localStorage.setItem('redirectURL', `"/test"`);

      const Cmp = NextAuthProtectedCallback({
        noTokenCallback: (redirectURL) => {
          console.log(redirectURL);
        },
      });

      act(() => {
        render(<Cmp />);
      });

      await waitFor(() => {
        expect(localStorage.getItem('redirectURL')).toBe(`undefined`);

        expect(console.log).toHaveBeenCalledWith('/test');
      });
    });

    // TODO: to fix later issue with window.location is conflicted with other test
    // it('should be able to save accessToken and execute callback', async () => {
    //   const useRouter = jest.spyOn(require('next/router'), 'useRouter');
    //   const router = { push: jest.fn(), query: { accessToken: 'toto' } };
    //   useRouter.mockReturnValue(router);
    //   console.log = jest.fn();

    //   localStorage.setItem('redirectURL', `"/test"`);

    //   const Cmp = NextAuthProtectedCallback({
    //     callback: (redirectURL) => {
    //       console.log(redirectURL);
    //     },
    //   });

    //   act(() => {
    //     Object.defineProperty(window, 'location', {
    //       value: {
    //         toString: () =>
    //           `http://localhost?accessToken=${encodeURIComponent('toto')}`,
    //       },
    //     });
    //     render(<Cmp />);
    //   });

    //   await waitFor(() => {
    //     expect(localStorage.getItem('accessToken')).toBe(`"toto"`);
    //     expect(localStorage.getItem('redirectURL')).toBe(`undefined`);

    //     expect(console.log).toHaveBeenCalledWith('/test');
    //   });
    // });

    // it('should be able to save accessToken and execute callback without RedirectUrl', async () => {
    //   console.log = jest.fn();

    //   const Cmp = NextAuthProtectedCallback({
    //     callback: (redirectURL) => {
    //       console.log(redirectURL);
    //     },
    //   });
    //   act(() => {
    //     Object.defineProperty(window, 'location', {
    //       value: {
    //         toString: () =>
    //           `http://localhost/?accessToken=${encodeURIComponent('toto')}`,
    //       },
    //     });
    //     render(<Cmp />);
    //   });

    //   await waitFor(() => {
    //     expect(localStorage.getItem('accessToken')).toBe(`"toto"`);
    //     expect(localStorage.getItem('redirectURL')).toBe(`undefined`);

    //     expect(console.log).toHaveBeenCalledWith(undefined);
    //   });
    // });
  });

  describe('useNextAuthProtected', () => {
    it('should be able to to tell by default user is not connected', () => {
      //@ts-ignore
      const wrapper = ({ children }) => (
        <NextAuthProvider>{children}</NextAuthProvider>
      );
      const { result } = renderHook(() => useNextAuthProtected(), {
        wrapper,
      });

      expect(result.current.isConnected).toStrictEqual(false);
    });
  });

  describe('useNextAuthProtectedHandler', () => {
    //@ts-ignore
    let container;

    beforeEach(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('redirectURL');
      //@ts-ignore
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      //@ts-ignore
      document.body.removeChild(container);
      //@ts-ignore
      container = null;
      cleanup();
    });

    it('should be able to redirect to login if user is not connected', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = {
        push: jest.fn(),
        query: {},
        asPath: '/test',
      };
      useRouter.mockReturnValue(router);

      const Cmp = () => {
        useNextAuthProtectedHandler({
          loginURL: '/auth/login',
          authCallbackURL: '/auth',
          renewTokenFct: () => {
            throw 'not available';
          },
        });

        return <></>;
      };

      act(() => {
        render(
          <NextAuthProvider>
            <Cmp />
          </NextAuthProvider>
        );
      });

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith(
          `/auth/login?redirectURL=${encodeURIComponent('/test')}`
        );
      });
    });

    it('should be able to not redirect to login if user is not connected and allowNotFound is true', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = {
        push: jest.fn(),
        query: {},
        asPath: '/test',
        pathname: '/404',
      };
      useRouter.mockReturnValue(router);

      const Cmp = () => {
        useNextAuthProtectedHandler({
          loginURL: '/auth/login',
          authCallbackURL: '/auth',
          renewTokenFct: () => {
            throw 'not available';
          },
          allowNotFound: true,
        });

        return <></>;
      };

      act(() => {
        render(
          <NextAuthProvider>
            <Cmp />
          </NextAuthProvider>
        );
      });

      await waitFor(() => {
        expect(router.push).not.toHaveBeenCalled();
      });
    });

    it('should be able to do nothing if user is connected', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = {
        push: jest.fn(),
        query: {},
        asPath: '/test',
      };
      useRouter.mockReturnValue(router);

      const Cmp = () => {
        useNextAuthProtectedHandler({
          publicURLs: ['/'],
          loginURL: '/auth/login',
          authCallbackURL: '/auth',
          renewTokenFct: () => {
            return 'newToken';
          },
        });

        return <></>;
      };

      act(() => {
        render(
          <NextAuthProvider>
            <Cmp />
          </NextAuthProvider>
        );
      });

      await waitFor(() => {
        expect(router.push).not.toHaveBeenCalled();
      });
    });

    it('should be able to verify access token on boot', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = {
        push: jest.fn(),
        query: {},
        asPath: '/test',
      };
      useRouter.mockReturnValue(router);

      localStorage.setItem('accessToken', '"test"');

      const Cmp = () => {
        useNextAuthProtectedHandler({
          publicURLs: ['/'],
          loginURL: '/auth/login',
          authCallbackURL: '/auth',
          verifyTokenFct: (accessToken) => {
            return accessToken === 'toto';
          },
          renewTokenFct: () => {
            return 'newToken';
          },
        });

        return <></>;
      };

      act(() => {
        render(
          <NextAuthProvider>
            <Cmp />
          </NextAuthProvider>
        );
      });

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith(
          `/auth/login?redirectURL=${encodeURIComponent('/test')}`
        );
      });
    });
  });
});

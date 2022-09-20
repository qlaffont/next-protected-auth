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
import { act, cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';

import {
  NextAuthProtectedCallback,
  NextAuthProtectedLogin,
  NextAuthProtectedLogout,
  useNextAuthProtected,
} from '../src';

describe('next-protected-auth', () => {
  it('works', () => {
    expect(NextAuthProtectedCallback).toBeDefined();
    expect(NextAuthProtectedLogin).toBeDefined();
    expect(NextAuthProtectedLogout).toBeDefined();
    expect(useNextAuthProtected).toBeDefined();
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
      });

      render(<Cmp />);

      expect(console.log).toHaveBeenCalledWith('hello');
    });

    it('should be able to save redirectURL if redirect is precised', () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = { push: jest.fn(), query: { redirectURL: 'test' } };
      useRouter.mockReturnValue(router);

      console.log = jest.fn();

      const Cmp = NextAuthProtectedLogin({
        callback: () => {
          console.log('hello');
        },
      });

      render(<Cmp />);

      expect(console.log).toHaveBeenCalledWith('hello');
      expect(localStorage.getItem('redirectURL')).toBe(`"test"`);
    });
  });

  describe('NextAuthProtectedLogout', () => {
    beforeEach(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('redirectURL');
    });

    afterEach(() => {
      cleanup();
    });

    it('should be able to execute call callback at the end and preCallback at the beginning', () => {
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

      render(<Cmp />);

      expect(console.log).toHaveBeenCalledWith('pre-hello');
      expect(console.log).toHaveBeenCalledWith('hello');
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

    it('should be able to save accessToken and execute callback', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = { push: jest.fn(), query: { accessToken: 'toto' } };
      useRouter.mockReturnValue(router);
      console.log = jest.fn();

      localStorage.setItem('redirectURL', `"/test"`);

      const Cmp = NextAuthProtectedCallback({
        callback: (redirectURL) => {
          console.log(redirectURL);
        },
      });

      act(() => {
        render(<Cmp />);
      });

      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe(`"toto"`);
        expect(localStorage.getItem('redirectURL')).toBe(`undefined`);

        expect(console.log).toHaveBeenCalledWith('/test');
      });
    });

    it('should be able to save accessToken and execute callback without RedirectUrl', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = { push: jest.fn(), query: { accessToken: 'toto' } };
      useRouter.mockReturnValue(router);
      console.log = jest.fn();

      const Cmp = NextAuthProtectedCallback({
        callback: (redirectURL) => {
          console.log(redirectURL);
        },
      });

      act(() => {
        render(<Cmp />);
      });

      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe(`"toto"`);
        expect(localStorage.getItem('redirectURL')).toBe(`undefined`);

        expect(console.log).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('useNextAuthProtected', () => {
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

    it('should be able to tell if user is not connected', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = {
        push: jest.fn(),
        query: {},
        asPath: '/',
      };
      useRouter.mockReturnValue(router);

      const Cmp = () => {
        const isConnected = useNextAuthProtected({
          publicURLs: ['/'],
          loginURL: '/auth/login',
          authCallbackURL: '/auth',
          renewTokenFct: () => {
            throw 'not available';
          },
        });

        return <>{isConnected ? 'true' : 'false'}</>;
      };

      let result;

      act(() => {
        result = render(<Cmp />);
      });

      await waitFor(() => {
        expect(result.asFragment()).toMatchSnapshot();
      });
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
        const isConnected = useNextAuthProtected({
          publicURLs: ['/'],
          loginURL: '/auth/login',
          authCallbackURL: '/auth',
          renewTokenFct: () => {
            throw 'not available';
          },
        });

        return <>{isConnected ? 'true' : 'false'}</>;
      };

      act(() => {
        render(<Cmp />);
      });

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith(
          `/auth/login?redirectURL=${encodeURIComponent('/test')}`
        );
      });
    });

    it('should be able to do nothing if user is not connected', async () => {
      const useRouter = jest.spyOn(require('next/router'), 'useRouter');
      const router = {
        push: jest.fn(),
        query: {},
        asPath: '/test',
      };
      useRouter.mockReturnValue(router);

      const Cmp = () => {
        const isConnected = useNextAuthProtected({
          publicURLs: ['/'],
          loginURL: '/auth/login',
          authCallbackURL: '/auth',
          renewTokenFct: () => {
            return 'newToken';
          },
        });

        return <>{isConnected ? 'true' : 'false'}</>;
      };

      act(() => {
        render(<Cmp />);
      });

      await waitFor(() => {
        expect(router.push).not.toHaveBeenCalled();
      });
    });
  });
});

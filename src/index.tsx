import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useLocalStorage, useSsr } from 'usehooks-ts';

import { currentURLIsAllowed } from './currentURLIsAllowed';

type AsyncVoidFunction = () => Promise<void>;

const getAndSaveAccessToken = async ({
  renewTokenFct,
  accessToken,
}: {
  renewTokenFct?: (oldAccessToken?: string) => string | Promise<string>;
  accessToken?: string;
}) => {
  if (!accessToken && renewTokenFct) {
    try {
      const accessToken = await renewTokenFct(
        localStorage.getItem('accessToken') ?? undefined
      );
      localStorage.setItem('accessToken', `"${accessToken}"`);
      return true;
    } catch (error) {
      //Impossible to fetch new token redirect to logout
      throw new Error('need to redirect to logout');
    }
  } else if (accessToken) {
    localStorage.setItem('accessToken', `"${accessToken}"`);
    return true;
  }

  return false;
};

export const NextAuthProtectedLogin =
  ({ callback }: { callback?: VoidFunction | AsyncVoidFunction }) =>
  () => {
    const router = useRouter();
    const [, setRedirectURL] = useLocalStorage<string | undefined>(
      'redirectURL',
      undefined
    );
    const { isBrowser } = useSsr();

    useEffect(() => {
      if (router.query && isBrowser && setRedirectURL) {
        (async () => {
          if (router.query.redirectURL) {
            setRedirectURL(router.query.redirectURL as string);
          }

          callback && (await callback());
        })();
      }
    }, [router.query, isBrowser, setRedirectURL]);

    return (
      <>
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      </>
    );
  };

export const NextAuthProtectedLogout =
  ({
    preCallback,
    callback,
  }: {
    preCallback?: VoidFunction | AsyncVoidFunction;
    callback?: VoidFunction | AsyncVoidFunction;
  }) =>
  () => {
    const { isBrowser } = useSsr();
    const [, setRedirectURL] = useLocalStorage<string | undefined>(
      'redirectURL',
      undefined
    );
    const [, setAccessToken] = useLocalStorage<string | undefined>(
      'accessToken',
      undefined
    );

    useEffect(() => {
      if (isBrowser && setRedirectURL && setAccessToken) {
        (async () => {
          preCallback && preCallback();

          setRedirectURL(undefined);
          setAccessToken(undefined);

          callback && callback();
        })();
      }
    }, [isBrowser, setRedirectURL, setAccessToken]);

    return (
      <>
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      </>
    );
  };

export const NextAuthProtectedCallback =
  ({
    callback,
  }: {
    callback?: (redirectURL?: string) => void | Promise<void>;
  }) =>
  () => {
    const router = useRouter();
    const { isBrowser } = useSsr();
    const [redirectURL, setRedirectURL] = useLocalStorage<string | undefined>(
      'redirectURL',
      undefined
    );

    useEffect(() => {
      if (router.query.accessToken && isBrowser && setRedirectURL) {
        (async () => {
          await getAndSaveAccessToken({
            accessToken: router.query.accessToken as string,
          });

          setRedirectURL(undefined);

          callback && (await callback(redirectURL ?? undefined));
        })();
      }
    }, [isBrowser, router.query, setRedirectURL]);

    return (
      <>
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      </>
    );
  };

export const useNextAuthProtected = ({
  publicURLs = [],
  loginURL,
  authCallbackURL,
  renewTokenFct,
}: {
  publicURLs?: string[];
  loginURL: string;
  authCallbackURL: string;
  renewTokenFct: (oldAccessToken?: string) => string | Promise<string>;
}) => {
  const router = useRouter();
  const [, setRedirectURL] = useLocalStorage<string | undefined>(
    'redirectURL',
    undefined
  );
  const [accessToken, setAccessToken] = useLocalStorage<string | undefined>(
    'accessToken',
    undefined
  );
  const { isBrowser } = useSsr();

  useEffect(() => {
    if (isBrowser) {
      (async () => {
        let userIsConnected = !!accessToken;

        if (
          router.asPath.split('?')[0] !== authCallbackURL &&
          !userIsConnected
        ) {
          // Try to get accessToken
          try {
            userIsConnected = await getAndSaveAccessToken({ renewTokenFct });
            // eslint-disable-next-line no-empty
          } catch (error) {}
        }

        //Check if user can access page
        if (
          !userIsConnected &&
          !currentURLIsAllowed(router.asPath, [
            ...publicURLs,
            loginURL,
            authCallbackURL,
          ])
        ) {
          //Redirect to login
          setRedirectURL(undefined);
          setAccessToken(undefined);
          return router.push(
            `${loginURL}?redirectURL=${encodeURIComponent(router.asPath)}`
          );
        }

        return;
      })();
    }
  }, [isBrowser, router.asPath]);

  return !!accessToken;
};

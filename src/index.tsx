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
        localStorage.getItem(keyAccessToken) ?? undefined
      );
      localStorage.setItem(keyAccessToken, `"${accessToken}"`);
      return true;
    } catch (error) {
      //Impossible to fetch new token redirect to logout
      throw new Error('need to redirect to logout');
    }
  } else if (accessToken) {
    localStorage.setItem(keyAccessToken, `"${accessToken}"`);
    return true;
  }

  return false;
};

const keyAccessToken = 'accessToken';
const keyRedirectUrl = 'redirectURL';

export const NextAuthProtectedLogin =
  ({
    callback,
    authCallbackURL,
  }: {
    callback?: VoidFunction | AsyncVoidFunction;
    authCallbackURL: string;
  }) =>
  () => {
    const router = useRouter();
    const [, setRedirectURL] = useLocalStorage<string | undefined>(
      keyRedirectUrl,
      undefined
    );
    const { isBrowser } = useSsr();

    useEffect(() => {
      if (router.query && isBrowser && setRedirectURL) {
        (async () => {
          if (
            localStorage.getItem(keyAccessToken) !== null &&
            localStorage.getItem(keyAccessToken) !== 'undefined'
          ) {
            router.push(authCallbackURL);
            return;
          }

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
      keyRedirectUrl,
      undefined
    );
    const [, setAccessToken] = useLocalStorage<string | undefined>(
      keyAccessToken,
      undefined
    );

    useEffect(() => {
      if (isBrowser && setRedirectURL && setAccessToken) {
        (async () => {
          preCallback && (await preCallback());

          setRedirectURL(undefined);
          setAccessToken(undefined);

          callback && (await callback());
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
    noTokenCallback,
  }: {
    callback?: (redirectURL?: string) => void | Promise<void>;
    noTokenCallback?: (redirectURL?: string) => void | Promise<void>;
  }) =>
  () => {
    const router = useRouter();
    const { isBrowser } = useSsr();
    const [redirectURL, setRedirectURL] = useLocalStorage<string | undefined>(
      keyRedirectUrl,
      undefined
    );

    useEffect(() => {
      if (isBrowser && setRedirectURL) {
        if (router.query.accessToken) {
          (async () => {
            await getAndSaveAccessToken({
              accessToken: router.query.accessToken as string,
            });

            setRedirectURL(undefined);

            callback && (await callback(redirectURL ?? undefined));
          })();
        } else {
          (async () => {
            setRedirectURL(undefined);

            noTokenCallback &&
              (await noTokenCallback(redirectURL ?? undefined));
          })();
        }
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
  verifyTokenFct,
}: {
  publicURLs?: string[];
  loginURL: string;
  authCallbackURL: string;
  renewTokenFct: (oldAccessToken?: string) => string | Promise<string>;
  verifyTokenFct?: (accessToken?: string) => boolean | Promise<boolean>;
}) => {
  const router = useRouter();
  const [accessToken, setAccessToken] = useLocalStorage<string | undefined>(
    keyAccessToken,
    undefined
  );
  const { isBrowser } = useSsr();

  useEffect(() => {
    if (isBrowser) {
      (async () => {
        let userIsConnected = !!accessToken;

        if (userIsConnected && verifyTokenFct) {
          if (!(await verifyTokenFct(accessToken))) {
            setAccessToken(undefined);

            return router.push(
              `${loginURL}?redirectURL=${encodeURIComponent(router.asPath)}`
            );
          }
        }

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

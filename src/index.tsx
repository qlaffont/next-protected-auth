import Head from 'next/head';
import { useRouter } from 'next/router';
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLocalStorage, useSsr } from 'usehooks-ts';

import { currentURLIsAllowed } from './currentURLIsAllowed';

type AsyncVoidFunction = () => Promise<void>;

const keyAccessToken = 'accessToken';
const keyRedirectUrl = 'redirectURL';

export const getAccessToken = () => {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }

  const value = localStorage.getItem(keyAccessToken);

  return value === 'undefined' || !value ? undefined : JSON.parse(value);
};

export const setAccessToken = (accessToken: string) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(keyAccessToken, `"${accessToken}"`);
};

export const removeAccessToken = () => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(keyAccessToken);
  return;
};

export const getAndSaveAccessToken = async ({
  renewTokenFct,
  accessToken,
}: {
  renewTokenFct?: (oldAccessToken?: string) => string | Promise<string>;
  accessToken?: string;
}) => {
  if (!accessToken && renewTokenFct) {
    try {
      const accessToken = await renewTokenFct(getAccessToken() ?? undefined);
      setAccessToken(accessToken);
      return true;
    } catch (error) {
      //Impossible to fetch new token redirect to logout
      throw new Error('need to redirect to logout');
    }
  } else if (accessToken) {
    setAccessToken(accessToken);
    return true;
  }

  return false;
};

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
      if (isBrowser && setRedirectURL) {
        //Can't use router it seems he don't have enough time to parse query here
        const currentUrl = new URL(window.location.toString());

        (async () => {
          if (getAccessToken() !== null && getAccessToken() !== undefined) {
            router.push(authCallbackURL);
            return;
          }

          if (currentUrl.searchParams.get('redirectURL')) {
            setRedirectURL(
              currentUrl.searchParams.get('redirectURL') as string
            );
          }

          callback && (await callback());
        })();
      }
    }, [isBrowser, setRedirectURL]);

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
    const { isBrowser } = useSsr();
    const [redirectURL, setRedirectURL] = useLocalStorage<string | undefined>(
      keyRedirectUrl,
      undefined
    );

    useEffect(() => {
      if (isBrowser && setRedirectURL) {
        //Can't use router it seems he don't have enough time to parse query here
        const currentUrl = new URL(window.location.toString());
        if (currentUrl.searchParams.get('accessToken')) {
          (async () => {
            await getAndSaveAccessToken({
              accessToken: currentUrl.searchParams.get('accessToken') as string,
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
    }, [isBrowser, setRedirectURL]);

    return (
      <>
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      </>
    );
  };

type NextAuthContextType = {
  isConnected: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>;
};

export const NextAuthContext = createContext<Partial<NextAuthContextType>>({
  isConnected: false,
});

export const NextAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  return (
    <NextAuthContext.Provider
      value={{ isConnected, setIsConnected } as Required<NextAuthContextType>}
    >
      {children}
    </NextAuthContext.Provider>
  );
};

export const useNextAuthProtected = (): {
  isConnected: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>;
} => {
  return useContext(NextAuthContext) as Required<NextAuthContextType>;
};

export const useNextAuthProtectedHandler = ({
  publicURLs = [],
  loginURL,
  authCallbackURL,
  renewTokenFct,
  verifyTokenFct,
  allowNotFound = false,
}: {
  publicURLs?: string[];
  loginURL: string;
  authCallbackURL?: string;
  renewTokenFct: (oldAccessToken?: string) => string | Promise<string>;
  verifyTokenFct?: (accessToken?: string) => boolean | Promise<boolean>;
  allowNotFound?: boolean;
}) => {
  const router = useRouter();
  const { setIsConnected } = useNextAuthProtected();
  const [accessToken, setAccessToken] = useLocalStorage<string | undefined>(
    keyAccessToken,
    undefined
  );
  const { isBrowser } = useSsr();

  useEffect(() => {
    if (isBrowser && setIsConnected && router.asPath) {
      (async () => {
        let userIsConnected = !!accessToken;

        if (userIsConnected && verifyTokenFct) {
          if (!(await verifyTokenFct(accessToken))) {
            setAccessToken(undefined);
            setIsConnected(false);

            return router.push(
              `${loginURL}?redirectURL=${encodeURIComponent(router.asPath)}`
            );
          } else {
            userIsConnected = true;
          }
        }

        if (
          router.asPath.split('?')[0] !== loginURL &&
          (authCallbackURL
            ? router.asPath.split('?')[0] !== authCallbackURL
            : true) &&
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
            ...(authCallbackURL ? [authCallbackURL] : []),
          ]) &&
          !(allowNotFound
            ? ['/_error', '/404'].indexOf(router.pathname) !== -1
            : false)
        ) {
          //Redirect to login
          setAccessToken(undefined);
          setIsConnected(false);
          return router.push(
            `${loginURL}?redirectURL=${encodeURIComponent(router.asPath)}`
          );
        }

        setIsConnected(userIsConnected);
        return;
      })();
    }
  }, [isBrowser, router?.asPath, setIsConnected]);
};

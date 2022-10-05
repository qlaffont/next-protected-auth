import '../styles/globals.css';

import type { AppProps } from 'next/app';

import {
  NextAuthProvider,
  useNextAuthProtected,
  useNextAuthProtectedHandler,
} from '../src/index';

function CustomApp({ children }) {
  useNextAuthProtectedHandler({
    publicURLs: ['/'],
    loginURL: '/auth/login',
    authCallbackURL: '/auth',
    renewTokenFct: (oldAccessToken) => {
      //Your function to renew expired access Token

      return 'new token or throw error';
    },
  });

  const { isConnected } = useNextAuthProtected();

  console.log('[USER] isConnected', isConnected);

  return <>{children}</>;
}

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <NextAuthProvider>
      <CustomApp>
        <Component {...pageProps} />
      </CustomApp>
    </NextAuthProvider>
  );
};

export default MyApp;

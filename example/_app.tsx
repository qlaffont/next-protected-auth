import '../styles/globals.css';

import type { AppProps } from 'next/app';

import { useNextAuthProtected } from '../src/index';

function MyApp({ Component, pageProps }: AppProps) {
  const isConnected = useNextAuthProtected({
    publicURLs: ['/'],
    loginURL: '/auth/login',
    authCallbackURL: '/auth',
    renewTokenFct: (oldAccessToken) => {
      //Your function to renew expired access Token

      return 'new token or throw error';
    },
  });

  console.log('[USER] isConnected', isConnected);

  return <Component {...pageProps} />;
}

export default MyApp;

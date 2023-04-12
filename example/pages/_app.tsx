import type { AppProps } from 'next/app';
import {
  NextAuthProvider,
  useNextAuthProtected,
  useNextAuthProtectedHandler,
} from 'next-protected-auth';

import { refreshToken } from '../src/myAPI'

function CustomApp({ children }) {
  useNextAuthProtectedHandler({
    publicURLs: ['/auth/signup', '/'],
    loginURL: '/auth/signin',
    renewTokenFct: async (oldAccessToken) => {
      if (!oldAccessToken) {
        throw 'not connected';
      }

      const { accessToken } = await refreshToken();

      return accessToken as string;
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

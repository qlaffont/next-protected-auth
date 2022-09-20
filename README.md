# Next Protected Auth

Add protected routes to Next.js

## Usage

```js
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useNextAuthProtected } from 'next-protected-auth';

function MyApp({ Component, pageProps }: AppProps) {
  const isConnected = useNextAuthProtected({
    publicURLs: ['/'],
    loginURL: '/auth/login',
    authCallbackURL: '/auth',
    renewTokenFct: (oldAccessToken) => {
      //Your function to renew expired access Token
    },
  });

  console.log('[USER] isConnected', isConnected);

  return <Component {...pageProps} />;
}
export default MyApp;

// pages/auth/index.tsx
import { NextAuthProtectedCallback } from '../../src';

export default NextAuthProtectedCallback({
  callback: () => {
    //Your function to redirect user after login
  },
});

export default AuthCallback;

// pages/auth/login.tsx
import { NextAuthProtectedLogin } from '../../src';

export default NextAuthProtectedLogin({
  callback: () => {
    //Your function to redirect to oauth portal
  },
});

export default AuthCallback;

// pages/auth/logout.tsx
import { NextAuthProtectedLogout } from '../../src';

export default NextAuthProtectedLogout({
  preCallback: () => {
    //Your function to tell to API that token is expired
  },
  callback: () => {
    //Your function to redirect to home
  },
});

```

## API

### NextAuthProtectedLogin

**Options**

| Field Name | Type                             | Description                                                         |
| ---------- | -------------------------------- | ------------------------------------------------------------------- |
| callback   | VoidFunction / AsyncVoidFunction | Specify a callback after login (generally redirect to oauth portal) |

Return: React Component

### NextAuthProtectedLogout

**Options**

| Field Name  | Type                             | Description                                                                       |
| ----------- | -------------------------------- | --------------------------------------------------------------------------------- |
| preCallback | VoidFunction / AsyncVoidFunction | Specify a callback before logout (generally send to api that user want to logout) |
| callback    | VoidFunction / AsyncVoidFunction | Specify a callback after logout (generally redirect to home)                      |

Return: React Component

### NextAuthProtectedCallback

**Options**

| Field Name | Type                             | Description                                                                     |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------- |
| callback   | VoidFunction / AsyncVoidFunction | Specify a callback after auth callback (generally redirect to protected routes) |


Return: React Component

### useNextAuthProtected

**Options**

| Field Name      | Type                                | Description                                              |
| --------------- | ----------------------------------- | -------------------------------------------------------- |
| publicURLs      | string[]                            | List of public URLs                                      |
| loginURL        | string                              | Endpoint for login (ex: /auth/login)                     |
| authCallbackURL | string                              | Endpoint for auth callback (ex: /auth)                   |
| renewTokenFct   | (oldAccessToken?: string) => string | Function who will run to renew token (ex: refresh token) |

Return: Hook who need to be use to pages/_app.tsx

## Maintain

This package use [TSdx](https://github.com/jaredpalmer/tsdx). Please check documentation to update this package.

import { setAccessToken, useNextAuthProtected } from 'next-protected-auth';
import { useState, useCallback } from 'react';

const AUTH_BASE_PATH = 'http://my-api.io';

export const refreshToken = async () => {
  const res = await fetch(`${AUTH_BASE_PATH}/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (res.ok) {
    return res.json(); // An object with an 'accessToken' string value
  }

  throw res.json();
}

type LoginBody = {
  email: string;
  password: string;
}

type LoginResponse = {
  expirationTime: string;
  accessToken: string;
}

const login = async ({ email, password }: LoginBody): Promise<LoginResponse> => {
  const res = await fetch(`${AUTH_BASE_PATH}/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (res.status !== 200) {
    throw new Error('Login error');
  }

  return res.json();
};

export const logout = async (): Promise<void> => {
  const res = await fetch(`${AUTH_BASE_PATH}/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (res.status !== 200) {
    throw new Error('Logout error');
  }
};

export const useLogin = () => {
  const { setIsConnected } = useNextAuthProtected();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const login = useCallback(
    async ({ email, password }: LoginBody) => {
      try {
        setIsLoading(true);

        const { accessToken } = await login({ email, password });

        setAccessToken(accessToken);
        setIsConnected(true);
      } catch (e) {
        setError(e);

        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsConnected, setAccessToken, setIsLoading, setError],
  );

  return {
    login,
    isLoading,
    error,
  };
};
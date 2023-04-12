import { NextAuthProtectedLogout } from 'next-protected-auth';

import { logout } from '../../src/myAPI'

const Signout = NextAuthProtectedLogout({
  preCallback: async () => {
    await logout();
  },
  callback: () => {
    window.location.replace('/auth/signin');
  },
});

export default Signout;
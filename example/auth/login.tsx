import { NextAuthProtectedLogin } from '../../src';

export default NextAuthProtectedLogin({
  callback: () => {
    //Your function to redirect to oauth portal
  },
  authCallbackURL: '/auth',
});

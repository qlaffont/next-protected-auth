import { NextAuthProtectedLogout } from '../../src';

export default NextAuthProtectedLogout({
  preCallback: () => {
    //Your function to tell to API that token is expired
  },
  callback: () => {
    //Your function to redirect to home
  },
});

import type { NextPage } from 'next';
import { useNextAuthProtected } from 'next-protected-auth';

// Accessible to logged users
const Protected: NextPage = () => {
  const { isConnected } = useNextAuthProtected();

  console.log('Only logged in users can see this page, is this user logged in ?', isConnected);

  return <>A protected route</>;
};

export default Protected;
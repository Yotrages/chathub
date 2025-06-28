import { setUserCredentials } from '@/libs/redux/authSlice';
import { AppDispatch } from '@/libs/redux/store';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

const OAuthSuccess = () => {
  const router = useRouter();
  const hasRun = useRef(false);
  const dispatch: AppDispatch = useDispatch()

  useEffect(() => {
    if (hasRun.current) return; 
    hasRun.current = true;

    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    const name = queryParams.get('name');
    const id = queryParams.get('id');
    const email = queryParams.get('email');

    console.log('Received:', { token, name, email });

    if (token && name && email && id) {
      setCookie('auth-token', token);
    dispatch(setUserCredentials({
        token: token,
        user: {
            id: id,
            email: email,
            name: name
        }
    }))
      router.push('/')
    } else {
      console.error('OAuth data missing from URL');
      router.push('/login');
    }
  }, [router]);

  return <p>Logging you in...</p>;
};

export default OAuthSuccess;

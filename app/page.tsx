'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = () => {
      if (!loading) {
        if (user) {
          console.log('Checking user email:', user.email);
          if (user.email === 'admin@sylonow.com') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      }
    };

    checkUserAndRedirect();
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Loading...</div>
    </div>
  );
}

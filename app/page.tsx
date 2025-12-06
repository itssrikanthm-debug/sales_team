'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/supabase/client';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (!loading) {
        if (user) {
          try {
            const roleData = await getUserRole(user.id);
            if (roleData.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            router.push('/dashboard'); // Default to dashboard if role check fails
          }
        } else {
          router.push('/login');
        }
      }
    };

    checkUserRoleAndRedirect();
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Loading...</div>
    </div>
  );
}

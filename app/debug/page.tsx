'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole, setUserRole, getAllUserRoles } from '@/lib/supabase/client';
import type { UserRole } from '@/types/types';

export default function DebugPage() {
  const [userRole, setUserRoleState] = useState<string>('');
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<'salesperson' | 'admin' | 'user'>('salesperson');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadUserRole();
    loadAllRoles();
  }, [user]);

  const loadUserRole = async () => {
    if (!user) return;

    try {
      const roleData = await getUserRole(user.id);
      setUserRoleState(roleData.role);
    } catch (error: any) {
      console.error('Error loading role:', error);
      setUserRoleState('Error: ' + error.message);
    }
  };

  const loadAllRoles = async () => {
    try {
      const roles = await getAllUserRoles();
      setAllRoles(roles || []);
    } catch (error: any) {
      console.error('Error loading all roles:', error);
      setMessage('Error loading roles: ' + error.message);
    }
  };

  const handleSetRole = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      await setUserRole(user.id, selectedRole);
      setMessage(`✅ Successfully set role to: ${selectedRole}`);
      await loadUserRole(); // Refresh current user role
      await loadAllRoles(); // Refresh all roles list
    } catch (error: any) {
      setMessage(`❌ Error setting role: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNavigation = (route: string) => {
    router.push(route);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🔧 Role-Based Navigation Debug</h1>

      {/* Current User Info */}
      <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>Current User</h2>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Current Role:</strong> {userRole || 'Loading...'}</p>
      </div>

      {/* Role Assignment */}
      <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>Set User Role</h2>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as any)}
          style={{ padding: '8px', marginRight: '10px' }}
        >
          <option value="salesperson">Salesperson</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <button
          onClick={handleSetRole}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Setting...' : 'Set Role'}
        </button>
        <div style={{ marginTop: '10px', color: message.includes('✅') ? 'green' : 'red' }}>
          {message}
        </div>
      </div>

      {/* Navigation Tests */}
      <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>Test Navigation</h2>
        <p>Click these buttons to test role-based redirects:</p>
        <button
          onClick={() => testNavigation('/')}
          style={{ margin: '5px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Test Root Page Redirect
        </button>
        <button
          onClick={() => testNavigation('/dashboard')}
          style={{ margin: '5px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Test Dashboard
        </button>
        <button
          onClick={() => testNavigation('/admin')}
          style={{ margin: '5px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Test Admin Page
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{ margin: '5px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Refresh Page
        </button>
      </div>

      {/* All Users and Roles */}
      <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>All Users & Roles</h2>
        <p><button
          onClick={loadAllRoles}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh List
        </button></p>

        {allRoles.length === 0 ? (
          <p>No user roles found or table doesn't exist yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>User ID</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Role</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {allRoles.map((roleData, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{roleData.user_id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{roleData.auth?.users?.email || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{roleData.role}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {new Date(roleData.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Console Instructions */}
      <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
        <h2>🔍 Debugging Instructions</h2>
        <ul>
          <li>Open browser DevTools (F12) and check the Console tab</li>
          <li>Look for logs starting with 🔍, ✅, ❌, ⚠️, 🎯</li>
          <li>If you see table not found errors, run the user_roles.sql in Supabase</li>
          <li>Set your role above and test navigation</li>
          <li>Check that admin users go to /admin and salespeople go to /dashboard</li>
        </ul>
      </div>

      {/* Back to Login */}
      <button
        onClick={() => router.push('/login')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Back to Login
      </button>
    </div>
  );
}

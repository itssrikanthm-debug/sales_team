import { createClient } from '@supabase/supabase-js';
import type { Vendor } from '@/types/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For auth
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// For vendors
export const getVendorsBySalesperson = async (salespersonId: string) => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*, categories(name)')
    .eq('salesperson_id', salespersonId);

  if (error) throw error;
  return data;
};

// For categories
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const createVendor = async (vendorData: {
  v_name: string;
  v_type: string | null;
  v_phonenumber: string;
  v_address: string;
  total_price: number;
  v_listing_count: number;
  verified_photo_url?: string | null;
  business_photo_url?: string | null;
  salesperson_id: string;
  salesperson_email: string;
  status?: string;
}) => {
  const { data, error } = await supabase
    .from('vendors')
    .insert(vendorData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// New functions for admin and salesperson operations
export const getSalespersonEarnings = async (salespersonId: string) => {
  const { data, error } = await supabase
    .from('salesperson_earnings')
    .select('*')
    .eq('salesperson_id', salespersonId)
    .single();

  if (error) throw error;
  return data;
};

export const getPendingVendors = async () => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*, categories(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAllVendors = async () => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getVendorsByStatus = async (salespersonId: string, status: string) => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*, categories(name)')
    .eq('salesperson_id', salespersonId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const approveVendor = async (
  vendorId: string,
  adminUserId: string,
  adminEmail: string,
  approvedListingCount: number,
  adminNotes?: string
) => {
  const { data, error } = await supabase
    .from('vendors')
    .update({
      status: 'approved',
      approved_listing_count: approvedListingCount,
      approved_earnings: approvedListingCount * 20, // ₹20 per listing
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
      approver_email: adminEmail,
      admin_notes: adminNotes,
      rejection_reason: null, // Clear any previous rejection
    })
    .eq('id', vendorId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const rejectVendor = async (
  vendorId: string,
  adminUserId: string,
  adminEmail: string,
  rejectionReason: string,
  adminNotes?: string
) => {
  const { data, error } = await supabase
    .from('vendors')
    .update({
      status: 'rejected',
     approved_listing_count: null,
      approved_earnings: null,
      approved_at: null,
      approved_by: adminUserId,
      approver_email: adminEmail,
      rejection_reason: rejectionReason,
      admin_notes: adminNotes,
    })
    .eq('id', vendorId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserRole = async (userId: string) => {
  console.log('🔍 getUserRole: Fetching role for user ID:', userId);

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ getUserRole: Database error:', error);

      // Add more specific error debugging
      if (error?.message?.includes('relation') || error?.code === '42P01') {
        console.error('❌ getUserRole: user_roles table does not exist! Please run the user_roles.sql migration.');
        console.error('❌ getUserRole: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.error('❌ getUserRole: Available tables check...');

        // Try to list tables to see what exists
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');

        if (tablesError) {
          console.error('❌ getUserRole: Could not list tables:', tablesError);
        } else {
          console.log('✅ getUserRole: Available tables:', tables?.map(t => t.table_name));
        }
      }

      throw error;
    }

    console.log('✅ getUserRole: Query result - data:', data, 'error:', error);

    // If no role found, return default salesperson role
    if (!data) {
      console.log('⚠️ getUserRole: No role found for user, returning default salesperson role');
      return { role: 'salesperson' as const };
    }

    console.log('🎯 getUserRole: User has role:', data.role);
    return data;
  } catch (error) {
    console.error('💥 getUserRole: Unhandled error:', error);
    throw error;
  }
};

// Utility functions for debugging and testing roles
export const setUserRole = async (userId: string, role: 'salesperson' | 'admin' | 'user') => {
  console.log('🔧 setUserRole: Setting role', role, 'for user ID:', userId);

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ setUserRole: Database error:', error);
      throw error;
    }

    console.log('✅ setUserRole: Successfully set role to:', data.role);
    return data;
  } catch (error) {
    console.error('💥 setUserRole: Unhandled error:', error);
    throw error;
  }
};

export const getAllUserRoles = async () => {
  console.log('📋 getAllUserRoles: Fetching all user roles');

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at,
        auth.users!user_id(
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ getAllUserRoles: Database error:', error);

      if (error?.message?.includes('relation') || error?.code === '42P01') {
        console.error('❌ getAllUserRoles: user_roles table does not exist!');
      }

      throw error;
    }

    console.log('✅ getAllUserRoles: Found', data?.length || 0, 'user roles');
    return data;
  } catch (error) {
    console.error('💥 getAllUserRoles: Unhandled error:', error);
    throw error;
  }
};

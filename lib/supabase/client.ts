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
      approved_by: null,
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
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};

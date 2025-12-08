export interface Vendor {
  id: string;
  v_id: string;
  v_name: string;
  v_type: string | null; // UUID from categories
  v_phonenumber: string;
  v_address: string;
  v_listing_count: number | null;
  total_price: number;
  verified_photo_url: string | null;
  business_photo_url: string | null;
  salesperson_id: string | null;
  salesperson_email: string | null;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_listing_count: number | null;
  approved_earnings: number | null;
  approved_at: string | null;
  approved_by: string | null;
  approver_email: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  categories?: Category;
}

export interface User {
  id: string;
  email: string;
  // Add other user fields as needed
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface SalespersonEarnings {
  salesperson_id: string;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_earnings: number;
}

export interface UserRole {
  user_id: string;
  role: 'salesperson' | 'admin' | 'user';
  created_at: string;
}

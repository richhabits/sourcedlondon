// Mirrors supabase/schema.sql — keep in sync with the website's tables.
export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  spec: string | null;
  price_gbp: number | null;
  price_poa: boolean;
  description: string | null;
  photos: string[];
  status: 'available' | 'reserved' | 'sold';
  created_at: string;
};

export type EnquiryInput = {
  lead_type: 'purchase' | 'sell' | 'app_waitlist';
  name: string;
  email: string;
  phone?: string;
  make?: string;
  model?: string;
  budget?: string;
  message?: string;
};

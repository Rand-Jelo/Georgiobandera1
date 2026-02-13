export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  phone: string | null;
  is_admin: boolean;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: number | null;
  password_reset_token: string | null;
  password_reset_expires: number | null;
  created_at: number;
  updated_at: number;
}

export interface Category {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  description_en: string | null;
  description_sv: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface Product {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  description_en: string | null;
  description_sv: string | null;
  instructions_en: string | null;
  instructions_sv: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  stock_quantity: number;
  track_inventory: boolean;
  created_at: number;
  updated_at: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name_en: string | null;
  name_sv: string | null;
  sku: string | null;
  price: number | null;
  compare_at_price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  option1_name: string | null;
  option1_value: string | null;
  option2_name: string | null;
  option2_value: string | null;
  option3_name: string | null;
  option3_value: string | null;
  created_at: number;
  updated_at: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
  sort_order: number;
  created_at: number;
}

export interface HeroImage {
  id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
  sort_order: number;
  active: number; // 0 or 1
  created_at: number;
  updated_at: number;
}

export interface CartItem {
  id: string;
  user_id: string | null;
  session_id: string | null;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: number;
  updated_at: number;
}

export interface ShippingRegion {
  id: string;
  name_en: string;
  name_sv: string;
  code: string;
  base_price: number;
  free_shipping_threshold: number | null;
  active: boolean;
  countries: string[]; // Array of ISO country codes (e.g., ["SE"], ["AT", "BE", "DE", ...])
  created_at: number;
  updated_at: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_method: 'stripe' | 'paypal' | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id: string | null;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  currency: string;
  shipping_region_id: string | null;
  shipping_name: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  price: number;
  quantity: number;
  total: number;
  created_at: number;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at: number;
  updated_at: number;
}

export interface MessageReply {
  id: string;
  message_id: string;
  reply_text: string;
  replied_by: string;
  from_admin: boolean;
  created_at: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_purchase: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  user_usage_limit: number;
  valid_from: number | null;
  valid_until: number | null;
  active: boolean;
  created_at: number;
  updated_at: number;
}

export interface DiscountCodeUsage {
  id: string;
  discount_code_id: string;
  order_id: string;
  user_id: string | null;
  email: string;
  discount_amount: number;
  created_at: number;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string | null;
  name: string;
  email: string;
  rating: number; // 1-5
  title: string | null;
  review_text: string;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  created_at: number;
  updated_at: number;
}


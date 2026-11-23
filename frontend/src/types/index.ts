export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  is_active: boolean;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
  created_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  product_count?: number;
  created_at?: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  category_id: number;
  category_name?: string;
  supplier_id?: number;
  supplier_name?: string;
  cost_price: number;
  unit_price: number;
  quantity: number;
  reorder_level: number;
  is_active: boolean;
  is_low_stock: boolean;
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  total_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface StockTransaction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  user_id?: number;
  user_name: string;
  transaction_type: 'IN' | 'OUT';
  quantity: number;
  unit_price: number;
  total_amount: number;
  balance_after: number;
  reference_no?: string;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  timestamp: string;
}

export interface SummaryStats {
  total_products: number;
  total_stock_units: number;
  total_inventory_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_transactions: number;
  total_categories: number;
  total_suppliers: number;
}

export interface AIDiagnosis {
  matched: boolean;
  engine: string;
  category: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  root_cause: string;
  remediation: string[];
  sanitized_snippet?: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

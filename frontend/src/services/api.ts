import axios from 'axios';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  DEMO_SAMPLES,
} from './demoData';
import { Product, StockTransaction, Category, Supplier } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Local mock store for GitHub Pages live demo mode
const getStore = <T>(key: string, initial: T): T => {
  try {
    const data = localStorage.getItem(`smartstock_${key}`);
    return data ? JSON.parse(data) : initial;
  } catch {
    return initial;
  }
};

const setStore = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(`smartstock_${key}`, JSON.stringify(data));
  } catch {}
};

// Initialize demo store if empty
if (!localStorage.getItem('smartstock_products')) setStore('products', INITIAL_PRODUCTS);
if (!localStorage.getItem('smartstock_categories')) setStore('categories', INITIAL_CATEGORIES);
if (!localStorage.getItem('smartstock_suppliers')) setStore('suppliers', INITIAL_SUPPLIERS);
if (!localStorage.getItem('smartstock_transactions')) setStore('transactions', INITIAL_TRANSACTIONS);

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartstock_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: 401 handling + Seamless GitHub Pages Offline Demo Fallback
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Auth 401 expiration handling
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('smartstock_token');
        localStorage.removeItem('smartstock_user');
        window.location.href = '/login?expired=1';
      }
      return Promise.reject(error);
    }

    // 2. If backend is offline or on static GitHub Pages, activate interactive mock engine
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error');
    if (isNetworkError && error.config) {
      const url = error.config.url || '';
      const method = (error.config.method || 'get').toLowerCase();
      let data: any = {};
      try {
        data = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : (error.config.data || {});
      } catch {}

      const products: Product[] = getStore('products', INITIAL_PRODUCTS);
      const categories: Category[] = getStore('categories', INITIAL_CATEGORIES);
      const suppliers: Supplier[] = getStore('suppliers', INITIAL_SUPPLIERS);
      const transactions: StockTransaction[] = getStore('transactions', INITIAL_TRANSACTIONS);

      // Route: /auth/login
      if (url.includes('/auth/login') && method === 'post') {
        const username = data.username || 'admin';
        const role = username.toLowerCase().includes('staff') ? 'EMPLOYEE' : 'ADMIN';
        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            message: 'Authenticated in Live Demonstration Mode',
            token: 'demo-live-jwt-token-smartstock',
            user: { id: 1, username, email: `${username}@smartstock.io`, role, is_active: true },
          },
        });
      }

      // Route: /analytics/summary
      if (url.includes('/analytics/summary')) {
        const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
        const totalVal = products.reduce((acc, p) => acc + (p.quantity * p.cost_price), 0);
        const lowStock = products.filter((p) => p.quantity <= p.reorder_level && p.quantity > 0).length;
        const outStock = products.filter((p) => p.quantity === 0).length;
        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            summary: {
              total_products: products.length,
              total_stock_units: totalUnits,
              total_inventory_value: Math.round(totalVal * 100) / 100,
              low_stock_count: lowStock,
              out_of_stock_count: outStock,
              total_transactions: transactions.length,
              total_categories: categories.length,
              total_suppliers: suppliers.length,
            },
          },
        });
      }

      // Route: /analytics/charts
      if (url.includes('/analytics/charts')) {
        const catDist = categories.map((c) => {
          const prods = products.filter((p) => p.category_id === c.id);
          const val = prods.reduce((acc, p) => acc + (p.quantity * p.cost_price), 0);
          return { name: c.name, product_count: prods.length, total_value: Math.round(val) };
        });
        const topVal = [...products].sort((a, b) => (b.quantity * b.cost_price) - (a.quantity * a.cost_price)).slice(0, 5).map((p) => ({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          total_value: Math.round(p.quantity * p.cost_price),
        }));
        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            category_distribution: catDist,
            top_value_products: topVal,
            stock_movement: {
              total_in: transactions.filter((t) => t.transaction_type === 'IN').reduce((acc, t) => acc + t.quantity, 0),
              total_out: transactions.filter((t) => t.transaction_type === 'OUT').reduce((acc, t) => acc + t.quantity, 0),
            },
          },
        });
      }

      // Route: /products/low-stock
      if (url.includes('/products/low-stock')) {
        const low = products.filter((p) => p.quantity <= p.reorder_level);
        return Promise.resolve({ status: 200, data: { success: true, count: low.length, data: low } });
      }

      // Route: /products/export/csv
      if (url.includes('/products/export/csv')) {
        const csvRows = ['SKU,Name,Category,Cost,Price,Qty,Reorder,Value'];
        products.forEach((p) => csvRows.push(`${p.sku},"${p.name}",${p.category_name},${p.cost_price},${p.unit_price},${p.quantity},${p.reorder_level},${p.total_value}`));
        return Promise.resolve({
          status: 200,
          headers: { 'content-type': 'text/csv' },
          data: new Blob([csvRows.join('\n')], { type: 'text/csv' }),
        });
      }

      // Route: /products
      if (url.includes('/products')) {
        if (method === 'post') {
          const newProd: Product = {
            id: Date.now(),
            sku: data.sku || `SKU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            barcode: data.barcode || data.sku,
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            category_name: categories.find((c) => c.id === data.category_id)?.name || 'General',
            supplier_id: data.supplier_id,
            supplier_name: suppliers.find((s) => s.id === data.supplier_id)?.name || 'None',
            cost_price: Number(data.cost_price),
            unit_price: Number(data.unit_price),
            quantity: Number(data.quantity || 0),
            reorder_level: Number(data.reorder_level || 10),
            is_active: true,
            is_low_stock: Number(data.quantity) <= Number(data.reorder_level),
            stock_status: Number(data.quantity) === 0 ? 'OUT_OF_STOCK' : Number(data.quantity) <= Number(data.reorder_level) ? 'LOW_STOCK' : 'IN_STOCK',
            total_value: Number(data.cost_price) * Number(data.quantity || 0),
          };
          products.unshift(newProd);
          setStore('products', products);
          return Promise.resolve({ status: 201, data: { success: true, data: newProd } });
        }
        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            data: products,
            pagination: { page: 1, per_page: 50, total_items: products.length, total_pages: 1 },
          },
        });
      }

      // Route: /categories
      if (url.includes('/categories')) {
        return Promise.resolve({ status: 200, data: { success: true, count: categories.length, data: categories } });
      }

      // Route: /suppliers
      if (url.includes('/suppliers')) {
        return Promise.resolve({ status: 200, data: { success: true, count: suppliers.length, data: suppliers } });
      }

      // Route: /stock/in
      if (url.includes('/stock/in') && method === 'post') {
        const prod = products.find((p) => p.id === Number(data.product_id));
        if (prod) {
          prod.quantity += Number(data.quantity);
          prod.total_value = prod.quantity * prod.cost_price;
          prod.is_low_stock = prod.quantity <= prod.reorder_level;
          prod.stock_status = prod.quantity <= prod.reorder_level ? 'LOW_STOCK' : 'IN_STOCK';
          const newTx: StockTransaction = {
            id: Date.now(),
            product_id: prod.id,
            product_name: prod.name,
            product_sku: prod.sku,
            user_name: 'admin',
            transaction_type: 'IN',
            quantity: Number(data.quantity),
            unit_price: Number(data.unit_price || prod.cost_price),
            total_amount: Number(data.quantity) * Number(data.unit_price || prod.cost_price),
            balance_after: prod.quantity,
            reference_no: data.reference_no || `PO-${Date.now().toString().slice(-6)}`,
            notes: data.notes,
            created_at: new Date().toISOString(),
          };
          transactions.unshift(newTx);
          setStore('products', products);
          setStore('transactions', transactions);
          return Promise.resolve({ status: 200, data: { success: true, product: prod, transaction: newTx } });
        }
      }

      // Route: /stock/out
      if (url.includes('/stock/out') && method === 'post') {
        const prod = products.find((p) => p.id === Number(data.product_id));
        if (prod) {
          if (prod.quantity < Number(data.quantity)) {
            return Promise.reject({
              response: {
                status: 400,
                data: {
                  success: false,
                  error: 'Insufficient Stock',
                  message: `Cannot dispense ${data.quantity} units. Only ${prod.quantity} units currently available.`,
                  available_stock: prod.quantity,
                  requested_quantity: data.quantity,
                },
              },
            });
          }
          prod.quantity -= Number(data.quantity);
          prod.total_value = prod.quantity * prod.cost_price;
          prod.is_low_stock = prod.quantity <= prod.reorder_level;
          prod.stock_status = prod.quantity === 0 ? 'OUT_OF_STOCK' : prod.quantity <= prod.reorder_level ? 'LOW_STOCK' : 'IN_STOCK';
          const newTx: StockTransaction = {
            id: Date.now(),
            product_id: prod.id,
            product_name: prod.name,
            product_sku: prod.sku,
            user_name: 'admin',
            transaction_type: 'OUT',
            quantity: Number(data.quantity),
            unit_price: Number(data.unit_price || prod.unit_price),
            total_amount: Number(data.quantity) * Number(data.unit_price || prod.unit_price),
            balance_after: prod.quantity,
            reference_no: data.reference_no || `SO-${Date.now().toString().slice(-6)}`,
            notes: data.notes,
            created_at: new Date().toISOString(),
          };
          transactions.unshift(newTx);
          setStore('products', products);
          setStore('transactions', transactions);
          return Promise.resolve({ status: 200, data: { success: true, product: prod, transaction: newTx } });
        }
      }

      // Route: /stock/transactions
      if (url.includes('/stock/transactions')) {
        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            data: transactions.slice(0, 20),
            pagination: { page: 1, per_page: 20, total_items: transactions.length, total_pages: 1 },
          },
        });
      }

      // Route: /ai/samples
      if (url.includes('/ai/samples')) {
        return Promise.resolve({ status: 200, data: { success: true, samples: DEMO_SAMPLES } });
      }

      // Route: /ai/diagnose-log
      if (url.includes('/ai/diagnose-log')) {
        const log = data.log || '';
        let matched = false;
        let title = 'Unclassified System Event';
        let category = 'GENERAL_RUNTIME';
        let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        let root_cause = 'The provided stack trace indicates an unexpected execution anomaly.';
        let remediation = ['Review container logs with docker compose logs', 'Verify environmental configurations'];

        if (log.includes('Connection refused') || log.includes('psycopg2')) {
          matched = true;
          title = 'PostgreSQL Connection Failure';
          category = 'DATABASE_CONNECTIVITY';
          severity = 'CRITICAL';
          root_cause = 'The backend service cannot connect to PostgreSQL on port 5432.';
          remediation = ['Verify database container health via docker compose ps postgres', 'Inspect database credentials in .env'];
        } else if (log.includes('InsufficientStockError') || log.includes('Cannot dispense')) {
          matched = true;
          title = 'Stock Depletion & Negative Inventory Block';
          category = 'INSUFFICIENT_STOCK';
          severity = 'HIGH';
          root_cause = 'A Stock OUT operation requested more units than physically on hand.';
          remediation = ['Issue a Stock IN replenishment order for the affected SKU', 'Verify recent transaction audit logs'];
        } else if (log.includes('Signature has expired') || log.includes('JWTExtendedException')) {
          matched = true;
          title = 'JWT Authentication Token Expiration';
          category = 'AUTH_TOKEN_EXPIRED';
          severity = 'MEDIUM';
          root_cause = 'The client carried an expired JWT session token.';
          remediation = ['Re-authenticate via the login interface', 'Verify JWT_ACCESS_TOKEN_EXPIRES_MINUTES'];
        }

        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            diagnosis: { matched, engine: 'SmartStock AI Diagnostic Engine (Client/Cloud Hybrid)', title, category, severity, root_cause, remediation },
          },
        });
      }

      // Route: /healthz & /ready
      if (url.includes('/healthz') || url.includes('/ready')) {
        return Promise.resolve({ status: 200, data: { status: 'healthy', database: 'connected', mode: 'demo' } });
      }
    }

    return Promise.reject(error);
  }
);

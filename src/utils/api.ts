import { projectId, publicAnonKey } from './supabase/info';
import { supabase } from './supabase/client';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8966d869`;

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token || publicAnonKey;
  
  // For admin calls, check if we have an admin user stored locally
  const adminUser = localStorage.getItem('foodhub_admin_user');
  if (adminUser && endpoint.includes('/admin/')) {
    // Use a special admin token or the public key for admin calls
    token = publicAnonKey;
    
    // Add admin user info to headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Admin-User': adminUser,
      ...options.headers,
    };
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data;
}

// Vendor API calls
export const vendorAPI = {
  // Get vendor profile
  getProfile: () => apiCall('/vendor/profile'),

  // Update vendor profile
  updateProfile: (profileData: any) => 
    apiCall('/vendor/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),

  // Get vendor orders
  getOrders: () => apiCall('/vendor/orders'),

  // Get vendor statistics
  getStats: () => apiCall('/vendor/stats'),

  // Update order status
  updateOrderStatus: (orderId: string, status: string) =>
    apiCall(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Menu API calls
export const menuAPI = {
  // Get menu items
  getItems: () => apiCall('/menu/items'),

  // Add menu item
  addItem: (menuItem: any) =>
    apiCall('/menu/items', {
      method: 'POST',
      body: JSON.stringify(menuItem),
    }),

  // Update menu item
  updateItem: (itemId: string, updates: any) =>
    apiCall(`/menu/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Delete menu item
  deleteItem: (itemId: string) =>
    apiCall(`/menu/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Delete vendor account
  deleteAccount: () =>
    apiCall('/vendor/account', {
      method: 'DELETE',
    }),
};

// Customer API calls
export const customerAPI = {
  // Get all vendors
  getVendors: () => apiCall('/vendors'),

  // Get vendor menu
  getVendorMenu: (vendorId: string) => apiCall(`/vendors/${vendorId}/menu`),

  // Place order
  placeOrder: (orderData: any) =>
    apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
};

// Admin API calls
export const adminAPI = {
  // Get all vendors
  getVendors: () => apiCall('/admin/vendors'),

  // Get all orders
  getOrders: () => apiCall('/admin/orders'),

  // Update vendor status
  updateVendorStatus: (vendorId: string, status: string, isVerified?: boolean) =>
    apiCall(`/admin/vendors/${vendorId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, isVerified }),
    }),

  // Delete vendor
  deleteVendor: (vendorId: string) =>
    apiCall(`/admin/vendors/${vendorId}`, {
      method: 'DELETE',
    }),

  // Get commission data
  getCommissions: () => apiCall('/admin/commissions'),

  // Admin withdrawal
  withdraw: (amount: number, password: string, bankCode?: string, accountNumber?: string, accountName?: string) =>
    apiCall('/admin/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, password, bankCode, accountNumber, accountName }),
    }),

  // Get admin withdrawal history
  getWithdrawals: () => apiCall('/admin/withdrawals'),
};

// Payment API calls
export const paymentAPI = {
  // Initialize payment
  initialize: (orderId: string, email: string, amount: number) =>
    apiCall('/payment/initialize', {
      method: 'POST',
      body: JSON.stringify({ orderId, email, amount }),
    }),

  // Verify payment
  verify: (reference: string) =>
    apiCall('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    }),
};

// Wallet API calls
export const walletAPI = {
  // Get wallet details
  getWallet: () => apiCall('/vendor/wallet'),

  // Request withdrawal
  withdraw: (amount: number, password: string, bankCode: string, accountNumber: string, accountName?: string) =>
    apiCall('/vendor/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, password, bankCode, accountNumber, accountName }),
    }),

  // Get withdrawal history
  getWithdrawals: () => apiCall('/vendor/withdrawals'),
};

// Generic API calls
export const api = {
  // Health check
  health: () => apiCall('/health'),

  // Initialize demo data
  initDemo: () => apiCall('/init-demo', { method: 'POST' }),
};
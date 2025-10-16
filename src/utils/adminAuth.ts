// Admin authentication utilities for FoodHub

interface AdminCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  businessName?: string;
  location?: string;
  role: 'vendor' | 'admin' | 'customer';
  isVerified?: boolean;
}

// Get current admin credentials (either from localStorage or default)
export function getAdminCredentials(): AdminCredentials {
  try {
    const saved = localStorage.getItem('foodhub_admin_credentials');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Error reading admin credentials:', error);
  }
  
  // Default credentials
  return {
    email: 'flourisholuwatimilehin@gmail.com',
    password: 'Thesameasyours1.'
  };
}

// Check if provided credentials match admin credentials
export function checkAdminCredentials(email: string, password: string): boolean {
  const adminCred = getAdminCredentials();
  return email.toLowerCase().trim() === adminCred.email.toLowerCase() && 
         password === adminCred.password;
}

// Create admin user object
export function createAdminUser(): User {
  const adminCred = getAdminCredentials();
  return {
    id: 'admin-1',
    email: adminCred.email,
    role: 'admin'
  };
}

// Update admin credentials
export function updateAdminCredentials(email: string, password: string): boolean {
  try {
    const newCredentials = { email, password };
    localStorage.setItem('foodhub_admin_credentials', JSON.stringify(newCredentials));
    return true;
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    return false;
  }
}
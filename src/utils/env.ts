// Environment variable utility to safely access env vars across different environments

export function getEnvVar(key: string, fallback: string = ''): string {
  try {
    // Try window globals first (most reliable in browser environments)
    if (typeof window !== 'undefined' && (window as any)[key]) {
      return (window as any)[key] || fallback;
    }
    
    // Try Node.js process.env (for SSR/build environments)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || fallback;
    }
    
    // Try accessing environment through globalThis
    if (typeof globalThis !== 'undefined') {
      // Check for Vite environment variables on globalThis
      const env = (globalThis as any).__VITE_ENV__ || {};
      if (env[key]) {
        return env[key] || fallback;
      }
    }
    
    return fallback;
  } catch (error) {
    console.warn(`Could not access environment variable ${key}:`, error);
    return fallback;
  }
}

// Specific helper for Paystack configuration
export function getPaystackConfig() {
  return {
    publicKey: getEnvVar('VITE_PAYSTACK_PUBLIC_KEY', 'pk_test_example'),
    isConfigured: getEnvVar('VITE_PAYSTACK_PUBLIC_KEY', '') !== '' && 
                  getEnvVar('VITE_PAYSTACK_PUBLIC_KEY', '') !== 'pk_test_example'
  };
}

// Helper to set runtime environment variables (useful for admin configuration)
export function setRuntimeEnvVar(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      (window as any)[key] = value;
    }
  } catch (error) {
    console.warn(`Could not set runtime environment variable ${key}:`, error);
  }
}

// Initialize demo environment variables
export function initializeDemoEnv(): void {
  try {
    if (typeof window !== 'undefined') {
      // Set demo Paystack key if not already configured
      if (!(window as any).VITE_PAYSTACK_PUBLIC_KEY) {
        (window as any).VITE_PAYSTACK_PUBLIC_KEY = 'pk_test_demo';
      }
    }
  } catch (error) {
    console.warn('Could not initialize demo environment:', error);
  }
}
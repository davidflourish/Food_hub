// Error handling utilities for FoodHub

export function handleFetchError(error: any, fallbackMessage: string = 'An error occurred') {
  if (error instanceof Error) {
    if (error.name === 'AuthRetryableFetchError' || error.message.includes('Failed to fetch')) {
      // Handle network/fetch errors gracefully
      console.warn('Network error caught and handled:', error.message);
      return { error: 'Network connection issue. Please check your internet connection.' };
    }
  }
  
  console.error('Error:', error);
  return { error: fallbackMessage };
}

export function suppressNetworkErrors() {
  // Suppress fetch errors that might come from Supabase or other services
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args);
    } catch (error) {
      console.warn('Suppressed fetch error:', error);
      throw error;
    }
  };
}

// Initialize error suppression
if (typeof window !== 'undefined') {
  // Suppress unhandled promise rejections that might come from unused services
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Failed to fetch') || 
        event.reason?.name === 'AuthRetryableFetchError') {
      console.warn('Suppressed unhandled rejection:', event.reason);
      event.preventDefault();
    }
  });
}
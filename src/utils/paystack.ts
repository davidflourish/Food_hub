// Paystack utility functions for FoodHub

export interface PaystackConfig {
  publicKey: string;
}

// Get Paystack public key from environment or use test key
export function getPaystackPublicKey(): string {
  // Paystack test public key - replace with live key in production
  return 'pk_live_66da9b621828a364e77c12d4dcd98d28888f9607';
}

// Initialize Paystack popup
export function initializePaystackPopup(
  email: string,
  amount: number, // Amount in Naira
  reference: string,
  metadata: Record<string, any> = {}, // NEW: For order_id, vendor_id, etc.
  onSuccess: (reference: string) => void,
  onClose: () => void
) {
  // Check if PaystackPop is loaded
  if (typeof window === 'undefined' || !(window as any).PaystackPop) {
    console.error('Paystack library not loaded');
    return;
  }

  const handler = (window as any).PaystackPop.setup({
    key: getPaystackPublicKey(),
    email,
    amount: amount * 100, // Convert to kobo
    currency: 'NGN',
    ref: reference,
    metadata, // NEW: Pass order details for webhook matching
    onClose: function() {
      onClose();
    },
    callback: function(response: any) {
      // Optimistic UI update (e.g., mark order as paid locally)
      onSuccess(response.reference);
    }
  });

  handler.openIframe();
}

// Format amount in Naira
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

// NEW: Helper for withdrawal amount validation (min ₦1,000, in Naira)
export function validateWithdrawalAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 1000) return { valid: false, error: 'Minimum withdrawal is ₦1,000' };
  if (amount > 5000000) return { valid: false, error: 'Maximum withdrawal is ₦5,000,000' }; // Adjust as needed
  return { valid: true };
}

// List of Nigerian banks (for withdrawal) - unchanged, looks good!
export const nigerianBanks = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank', code: '023' },
  { name: 'Diamond Bank', code: '063' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank Nigeria', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank Plc', code: '030' },
  { name: 'Keystone Bank Limited', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank Plc', code: '101' },
  { name: 'Stanbic IBTC Bank Nigeria Limited', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Suntrust Bank Nigeria Limited', code: '100' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Unity Bank Plc', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Opay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
];
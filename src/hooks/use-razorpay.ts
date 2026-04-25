import { API_BASE } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  registration_number?: string;
}

export async function initiatePayment(params: {
  type: 'bgmi' | 'marathon' | 'sport';
  ref_id: number;
  sport?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (paymentResponse: RazorpayPaymentResponse) => void;
  onFailure: (message: string) => void;
}): Promise<void> {
  const { type, ref_id, sport, prefill, onSuccess, onFailure } = params;

  // Step 1 — create Razorpay order on backend
  const orderPayload: Record<string, string | number> = { type, ref_id };
  if (sport) orderPayload.sport = sport;

  let orderRes: Response;
  try {
    orderRes = await fetch(`${API_BASE}/create_order.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
  } catch {
    onFailure('Network error — could not connect to payment server');
    return;
  }

  let orderData: { success: boolean; message: string; data?: { order_id?: string; amount?: number; currency?: string; key_id?: string; free?: boolean } };
  try {
    orderData = await orderRes.json();
  } catch {
    onFailure('Invalid response from payment server');
    return;
  }

  if (!orderData.success) {
    onFailure(orderData.message || 'Failed to create payment order');
    return;
  }

  // Free entry — no checkout popup needed
  if (orderData.data?.free) {
    onSuccess({ razorpay_order_id: '', razorpay_payment_id: 'free', razorpay_signature: '' });
    return;
  }

  const { order_id, amount, currency, key_id } = orderData.data ?? {};

  if (!order_id || !key_id) {
    onFailure('Payment configuration error');
    return;
  }

  if (!window.Razorpay) {
    onFailure('Razorpay SDK not loaded — please refresh the page');
    return;
  }

  // Step 2 — open Razorpay checkout
  const rzp = new window.Razorpay({
    key: key_id,
    amount: amount ?? 0,
    currency: currency ?? 'INR',
    name: 'Mangalore Sports Fest 2026',
    description: `Registration — ${type.toUpperCase()}`,
    order_id: order_id,
    prefill: prefill ?? {},
    theme: { color: '#dc2626' },
    handler: (response: RazorpayPaymentResponse) => {
      onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        onFailure('Payment cancelled');
      },
    },
  });

  rzp.open();
}

export async function verifyPayment(params: {
  type: 'bgmi' | 'marathon' | 'sport';
  ref_id: number;
  response: RazorpayPaymentResponse;
}): Promise<PaymentResult> {
  const { type, ref_id, response } = params;

  // Free entry — skip verification
  if (response.razorpay_payment_id === 'free') {
    return { success: true, message: 'Registration successful!' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/verify_payment.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        type,
        ref_id,
      }),
    });
  } catch {
    return { success: false, message: 'Network error during payment verification' };
  }

  let data: { success: boolean; message: string };
  try {
    data = await res.json();
  } catch {
    return { success: false, message: 'Invalid verification response' };
  }

  return { success: data.success, message: data.message, registration_number: (data as any).data?.registration_number };
}

type CheckoutInput = {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
};

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: { description?: string; reason?: string; code?: string };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay checkout is only available in a browser.'));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay Checkout.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function openRazorpaySubscriptionCheckout(input: CheckoutInput): Promise<RazorpayResponse> {
  await loadCheckoutScript();
  if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable.');

  return new Promise<RazorpayResponse>((resolve, reject) => {
    let settled = false;
    const finishSuccess = (response: RazorpayResponse) => {
      if (settled) return;
      settled = true;
      resolve(response);
    };
    const finishFailure = (error: unknown) => {
      if (settled) return;
      settled = true;
      const failure = error as RazorpayFailure;
      reject(new Error(failure?.error?.description || 'Payment was not completed.'));
    };

    const checkout = new window.Razorpay({
      key: input.keyId,
      subscription_id: input.subscriptionId,
      name: input.name,
      description: input.description,
      prefill: input.prefill,
      subscription_card_change: true,
      theme: { color: '#FBBE3F' },
      handler: finishSuccess,
      modal: {
        confirm_close: true,
        escape: true,
        backdropclose: false,
        ondismiss: () => {
          if (!settled) reject(new Error('Payment was cancelled.'));
        },
      },
    });

    checkout.on('payment.failed', finishFailure);
    checkout.open();
  });
}

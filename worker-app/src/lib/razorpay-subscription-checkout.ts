import RazorpayCheckout from 'react-native-razorpay';

type PaymentMethod = 'upi' | 'card';

type CheckoutInput = {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  paymentMethod?: PaymentMethod;
  prefill?: { name?: string; email?: string; contact?: string };
};

export async function openRazorpaySubscriptionCheckout(input: CheckoutInput) {
  const paymentMethod = input.paymentMethod ?? 'upi';

  return RazorpayCheckout.open({
    key: input.keyId,
    subscription_id: input.subscriptionId,
    name: input.name,
    description: input.description,
    prefill: input.prefill,
    subscription_card_change: true,
    ...(paymentMethod === 'upi' ? { method: { upi: true } } : { method: { card: true } }),
    theme: { color: '#FBBE3F' },
  });
}

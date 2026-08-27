import RazorpayCheckout from 'react-native-razorpay';

type CheckoutInput = {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
};

export async function openRazorpaySubscriptionCheckout(input: CheckoutInput) {
  return RazorpayCheckout.open({
    key: input.keyId,
    subscription_id: input.subscriptionId,
    name: input.name,
    description: input.description,
    prefill: input.prefill,
    subscription_card_change: true,
    theme: { color: '#FBBE3F' },
  });
}

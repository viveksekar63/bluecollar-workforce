import { api } from './client';

export type EmployerSubscriptionPlan = { id: string; code: string; name: string; description?: string | null; priceInr: number; currency: string; billingInterval: string; jobLimit: number };
export type EmployerSubscription = { id: string; employerId: string; planId: string; razorpaySubscriptionId: string; status: string; currentPeriodStart?: string | null; currentPeriodEnd?: string | null; jobsUsed: number; jobLimit: number; cancelAtPeriodEnd: boolean; endedAt?: string | null; planCode: string; planName: string; priceInr: number; billingInterval: string };

export async function getSubscriptionPlans() { const response = await api.get<EmployerSubscriptionPlan[]>('/subscriptions/plans'); return response.data; }
export async function getCurrentSubscription() { const response = await api.get<{ active: boolean; subscription: EmployerSubscription | null }>('/subscriptions/current'); return response.data; }
export async function syncEmployerSubscription() { const response = await api.post('/subscriptions/sync'); return response.data as { synced: boolean; subscription: { status: string } | null }; }
export async function createEmployerSubscription(planCode: string) { const response = await api.post<{ keyId: string; subscriptionId: string; shortUrl: string | null; status: string; plan: EmployerSubscriptionPlan }>('/subscriptions', { planCode }); return response.data; }
export async function verifyEmployerSubscription(input: { razorpayPaymentId: string; razorpaySubscriptionId: string; razorpaySignature: string }) { const response = await api.post('/subscriptions/verify', input); return response.data as { verified: boolean; subscriptionId: string; status: string; active: boolean }; }
export async function cancelEmployerSubscription() { const response = await api.post('/subscriptions/cancel'); return response.data as { success: boolean; subscriptionId: string; cancelAtPeriodEnd: boolean }; }

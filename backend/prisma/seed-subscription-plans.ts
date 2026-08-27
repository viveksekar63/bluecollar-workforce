import { randomUUID } from 'crypto';

type SubscriptionPlanSeed = {
  code: string;
  name: string;
  description: string;
  priceInr: number;
  jobLimit: number;
  envKey?: string;
};

const plans: SubscriptionPlanSeed[] = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'Start with one free job posting. No payment required.',
    priceInr: 0,
    jobLimit: 1,
  },
  {
    code: 'STARTER',
    name: 'Starter',
    description: 'For employers posting a few jobs each month.',
    priceInr: 499,
    jobLimit: 5,
    envKey: 'RAZORPAY_PLAN_STARTER_ID',
  },
  {
    code: 'GROWTH',
    name: 'Growth',
    description: 'For employers with regular hiring needs.',
    priceInr: 999,
    jobLimit: 20,
    envKey: 'RAZORPAY_PLAN_GROWTH_ID',
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    description: 'For employers running high-volume hiring.',
    priceInr: 1999,
    jobLimit: 50,
    envKey: 'RAZORPAY_PLAN_BUSINESS_ID',
  },
];

export async function seedSubscriptionPlans(prisma: any) {
  console.log('\nCreating employer subscription plans...');
  for (const plan of plans) {
    const razorpayPlanId = plan.envKey ? process.env[plan.envKey]?.trim() || null : null;
    await prisma.$executeRaw`
      INSERT INTO "employer_subscription_plans"
        ("id", "code", "name", "description", "priceInr", "currency", "billingInterval", "jobLimit", "razorpayPlanId", "isActive", "updatedAt")
      VALUES
        (${randomUUID()}, ${plan.code}, ${plan.name}, ${plan.description}, ${plan.priceInr}, 'INR', 'MONTHLY', ${plan.jobLimit}, ${razorpayPlanId}, true, CURRENT_TIMESTAMP)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "priceInr" = EXCLUDED."priceInr",
        "billingInterval" = EXCLUDED."billingInterval",
        "jobLimit" = EXCLUDED."jobLimit",
        "razorpayPlanId" = EXCLUDED."razorpayPlanId",
        "isActive" = true,
        "updatedAt" = CURRENT_TIMESTAMP
    `;
    console.log(`  ✓ ${plan.code} (${razorpayPlanId ? 'Razorpay configured' : plan.code === 'FREE' ? 'Free / no Razorpay' : 'Razorpay plan id pending'})`);
  }
}

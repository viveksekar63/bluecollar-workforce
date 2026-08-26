CREATE TABLE "employer_subscription_plans" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceInr" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "billingInterval" TEXT NOT NULL DEFAULT 'MONTHLY',
  "jobLimit" INTEGER NOT NULL,
  "razorpayPlanId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employer_subscription_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "employer_subscription_plans_code_key" ON "employer_subscription_plans"("code");
CREATE UNIQUE INDEX "employer_subscription_plans_razorpayPlanId_key" ON "employer_subscription_plans"("razorpayPlanId");
CREATE INDEX "employer_subscription_plans_active_idx" ON "employer_subscription_plans"("isActive");

CREATE TABLE "employer_subscriptions" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "razorpaySubscriptionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'created',
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "jobsUsed" INTEGER NOT NULL DEFAULT 0,
  "jobLimit" INTEGER NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employer_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_subscriptions_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employer_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "employer_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "employer_subscriptions_razorpaySubscriptionId_key" ON "employer_subscriptions"("razorpaySubscriptionId");
CREATE INDEX "employer_subscriptions_employerId_status_idx" ON "employer_subscriptions"("employerId", "status");
CREATE INDEX "employer_subscriptions_currentPeriodEnd_idx" ON "employer_subscriptions"("currentPeriodEnd");

CREATE TABLE "employer_subscription_webhook_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employer_subscription_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "employer_subscription_webhook_events_eventId_key" ON "employer_subscription_webhook_events"("eventId");
CREATE INDEX "employer_subscription_webhook_events_event_idx" ON "employer_subscription_webhook_events"("event");

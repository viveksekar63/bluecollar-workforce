CREATE TABLE "employer_credit_wallets" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employer_credit_wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_credit_wallets_employerId_key" UNIQUE ("employerId"),
  CONSTRAINT "employer_credit_wallets_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employer_credit_wallets_balance_check" CHECK ("balance" >= 0)
);

CREATE TABLE "employer_credit_packages" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "priceInr" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "razorpayPlanId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employer_credit_packages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_credit_packages_code_key" UNIQUE ("code"),
  CONSTRAINT "employer_credit_packages_credits_check" CHECK ("credits" > 0),
  CONSTRAINT "employer_credit_packages_price_check" CHECK ("priceInr" > 0)
);

CREATE TABLE "employer_credit_transactions" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "description" TEXT,
  "razorpayPaymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employer_credit_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_credit_transactions_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employer_credit_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "employer_credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "employer_credit_transactions_employerId_idx" ON "employer_credit_transactions"("employerId");
CREATE INDEX "employer_credit_transactions_walletId_createdAt_idx" ON "employer_credit_transactions"("walletId", "createdAt");
CREATE INDEX "employer_credit_transactions_reference_idx" ON "employer_credit_transactions"("referenceType", "referenceId");

INSERT INTO "employer_credit_packages" ("id", "code", "name", "credits", "priceInr", "isActive", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'STARTER', 'Starter Credits', 10, 250, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'GROWTH', 'Growth Credits', 25, 575, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BUSINESS', 'Business Credits', 50, 1000, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

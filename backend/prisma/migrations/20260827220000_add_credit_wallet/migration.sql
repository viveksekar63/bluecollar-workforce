CREATE TABLE "employer_credit_wallets" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employer_credit_wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_credit_wallets_employerId_key" UNIQUE ("employerId"),
  CONSTRAINT "employer_credit_wallets_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "employer_credit_transactions" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "amountInr" INTEGER,
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employer_credit_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_credit_transactions_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "employer_credit_transactions_razorpayOrderId_key" ON "employer_credit_transactions"("razorpayOrderId");
CREATE INDEX "employer_credit_transactions_employerId_idx" ON "employer_credit_transactions"("employerId");
CREATE INDEX "employer_credit_transactions_status_idx" ON "employer_credit_transactions"("status");

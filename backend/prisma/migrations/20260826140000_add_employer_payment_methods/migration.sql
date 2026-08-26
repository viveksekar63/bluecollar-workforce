CREATE TABLE "employer_payment_methods" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "provider" TEXT,
  "providerPaymentMethodId" TEXT,
  "last4" TEXT,
  "upiId" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "employer_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "employer_payment_methods_employerId_idx" ON "employer_payment_methods"("employerId");
CREATE INDEX "employer_payment_methods_employerId_status_idx" ON "employer_payment_methods"("employerId", "status");

ALTER TABLE "employer_payment_methods"
  ADD CONSTRAINT "employer_payment_methods_employerId_fkey"
  FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

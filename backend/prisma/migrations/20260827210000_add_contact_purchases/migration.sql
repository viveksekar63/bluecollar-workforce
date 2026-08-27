CREATE TABLE "employer_contact_purchases" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "amountInr" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employer_contact_purchases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_contact_purchases_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employer_contact_purchases_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "employer_contact_purchases_employerId_idx" ON "employer_contact_purchases"("employerId");
CREATE INDEX "employer_contact_purchases_workerId_idx" ON "employer_contact_purchases"("workerId");
CREATE INDEX "employer_contact_purchases_status_idx" ON "employer_contact_purchases"("status");
CREATE UNIQUE INDEX "employer_contact_purchases_employerId_workerId_paid_key" ON "employer_contact_purchases"("employerId", "workerId", "status");

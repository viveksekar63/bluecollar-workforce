CREATE TABLE "employer_job_payment_transactions" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "razorpayOrderId" TEXT NOT NULL,
  "razorpayPaymentId" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employer_job_payment_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_job_payment_transactions_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employer_job_payment_transactions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "employer_job_payment_transactions_razorpayOrderId_key" ON "employer_job_payment_transactions"("razorpayOrderId");
CREATE UNIQUE INDEX "employer_job_payment_transactions_razorpayPaymentId_key" ON "employer_job_payment_transactions"("razorpayPaymentId");
CREATE INDEX "employer_job_payment_transactions_employerId_idx" ON "employer_job_payment_transactions"("employerId");
CREATE INDEX "employer_job_payment_transactions_jobId_idx" ON "employer_job_payment_transactions"("jobId");
CREATE INDEX "employer_job_payment_transactions_status_idx" ON "employer_job_payment_transactions"("status");

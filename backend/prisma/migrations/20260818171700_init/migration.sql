-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VERIFICATION_AGENT', 'EMPLOYER', 'SUPERVISOR', 'WORKER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'OTHER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('CURRENT', 'PERMANENT');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'WORKING', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('IDENTITY', 'ADDRESS', 'DOCUMENT', 'EMPLOYMENT', 'REFERENCE', 'EDUCATION', 'CRIMINAL', 'SKILL');

-- CreateEnum
CREATE TYPE "VerificationResultStatus" AS ENUM ('MATCH', 'PARTIAL_MATCH', 'NO_MATCH', 'NOT_FOUND', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('IDENTITY_CHECK', 'ADDRESS_CHECK', 'EMPLOYMENT_CHECK', 'REFERENCE_CHECK', 'BACKGROUND_CHECK', 'DOCUMENT_STORAGE', 'PROFILE_SHARING');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "LanguageLevel" AS ENUM ('BASIC', 'CONVERSATIONAL', 'FLUENT', 'NATIVE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'DAILY_WAGE', 'TEMPORARY', 'SELF_EMPLOYED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PROFILE_PHOTO', 'ID_PROOF', 'ADDRESS_PROOF', 'EXPERIENCE_LETTER', 'SALARY_SLIP', 'EDUCATION_CERTIFICATE', 'SKILL_CERTIFICATE', 'BANK_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EmployerStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'CONTRACT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE');

-- CreateEnum
CREATE TYPE "PaymentAccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SALARY', 'DAILY_WAGE', 'BONUS', 'REFUND', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOB', 'APPLICATION', 'VERIFICATION', 'PAYMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('WORKER', 'EMPLOYER', 'PAYMENT', 'SAFETY', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "profilePhotoUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workerCode" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "maritalStatus" "MaritalStatus",
    "bio" TEXT,
    "experienceYears" DECIMAL(65,30),
    "profileCompletion" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationScore" INTEGER,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAddress" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerBankAccount" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerSkill" (
    "workerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "experienceYears" DECIMAL(65,30),
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkerSkill_pkey" PRIMARY KEY ("workerId","skillId")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerLanguage" (
    "workerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "proficiency" "LanguageLevel" NOT NULL DEFAULT 'BASIC',

    CONSTRAINT "WorkerLanguage_pkey" PRIMARY KEY ("workerId","languageId")
);

-- CreateTable
CREATE TABLE "WorkerEducation" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "institution" TEXT,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerCertification" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingBody" TEXT,
    "certificateNo" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyType" TEXT,
    "registrationNo" TEXT,
    "gstNumber" TEXT,
    "description" TEXT,
    "status" "EmployerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentHistory" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT,
    "designation" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "salary" DECIMAL(65,30),
    "employmentType" "EmploymentType",
    "supervisorName" TEXT,
    "supervisorPhone" TEXT,
    "supervisorEmail" TEXT,
    "reasonForLeaving" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentReference" (
    "id" TEXT NOT NULL,
    "employmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "relationship" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "documentNumber" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentDocument" (
    "id" TEXT NOT NULL,
    "employmentId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "EmploymentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "provider" TEXT,
    "providerRef" TEXT,
    "status" "VerificationStatus" NOT NULL,
    "remarks" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "overallScore" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCheck" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerReference" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationResult" (
    "id" TEXT NOT NULL,
    "verificationCheckId" TEXT NOT NULL,
    "result" "VerificationResultStatus" NOT NULL,
    "score" INTEGER,
    "remarks" TEXT,
    "evidenceStorageKey" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationConsent" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "consented" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "pincode" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "salaryMin" DECIMAL(65,30),
    "salaryMax" DECIMAL(65,30),
    "salaryType" "SalaryType" NOT NULL,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSkill" (
    "jobId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("jobId","skillId")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shortlistedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "agreedRate" DECIMAL(65,30) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "latitudeIn" DECIMAL(65,30),
    "longitudeIn" DECIMAL(65,30),
    "latitudeOut" DECIMAL(65,30),
    "longitudeOut" DECIMAL(65,30),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceBreak" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),

    CONSTRAINT "AttendanceBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerRating" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerReview" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "provider" TEXT,
    "providerAccountId" TEXT,
    "status" "PaymentAccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "workerId" TEXT,
    "employerId" TEXT,
    "type" "ComplaintType" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "OtpRequest_phone_idx" ON "OtpRequest"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_userId_key" ON "Worker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_workerCode_key" ON "Worker"("workerCode");

-- CreateIndex
CREATE INDEX "WorkerAddress_workerId_idx" ON "WorkerAddress"("workerId");

-- CreateIndex
CREATE INDEX "EmergencyContact_workerId_idx" ON "EmergencyContact"("workerId");

-- CreateIndex
CREATE INDEX "WorkerBankAccount_workerId_idx" ON "WorkerBankAccount"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "WorkerSkill_skillId_idx" ON "WorkerSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE INDEX "WorkerLanguage_languageId_idx" ON "WorkerLanguage"("languageId");

-- CreateIndex
CREATE INDEX "WorkerEducation_workerId_idx" ON "WorkerEducation"("workerId");

-- CreateIndex
CREATE INDEX "WorkerCertification_workerId_idx" ON "WorkerCertification"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_userId_key" ON "Employer"("userId");

-- CreateIndex
CREATE INDEX "EmploymentHistory_workerId_idx" ON "EmploymentHistory"("workerId");

-- CreateIndex
CREATE INDEX "EmploymentReference_employmentId_idx" ON "EmploymentReference"("employmentId");

-- CreateIndex
CREATE INDEX "Document_workerId_idx" ON "Document"("workerId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_verificationStatus_idx" ON "Document"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentDocument_documentId_key" ON "EmploymentDocument"("documentId");

-- CreateIndex
CREATE INDEX "EmploymentDocument_employmentId_idx" ON "EmploymentDocument"("employmentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerification_documentId_key" ON "DocumentVerification"("documentId");

-- CreateIndex
CREATE INDEX "VerificationRequest_workerId_idx" ON "VerificationRequest"("workerId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationCheck_verificationId_idx" ON "VerificationCheck"("verificationId");

-- CreateIndex
CREATE INDEX "VerificationCheck_type_idx" ON "VerificationCheck"("type");

-- CreateIndex
CREATE INDEX "VerificationCheck_status_idx" ON "VerificationCheck"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationResult_verificationCheckId_key" ON "VerificationResult"("verificationCheckId");

-- CreateIndex
CREATE INDEX "VerificationConsent_workerId_idx" ON "VerificationConsent"("workerId");

-- CreateIndex
CREATE INDEX "VerificationConsent_consentType_idx" ON "VerificationConsent"("consentType");

-- CreateIndex
CREATE INDEX "Job_employerId_idx" ON "Job"("employerId");

-- CreateIndex
CREATE INDEX "Job_city_idx" ON "Job"("city");

-- CreateIndex
CREATE INDEX "Job_state_idx" ON "Job"("state");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "JobSkill_skillId_idx" ON "JobSkill"("skillId");

-- CreateIndex
CREATE INDEX "JobApplication_workerId_idx" ON "JobApplication"("workerId");

-- CreateIndex
CREATE INDEX "JobApplication_jobId_idx" ON "JobApplication"("jobId");

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_workerId_key" ON "JobApplication"("jobId", "workerId");

-- CreateIndex
CREATE INDEX "JobAssignment_workerId_idx" ON "JobAssignment"("workerId");

-- CreateIndex
CREATE INDEX "JobAssignment_jobId_idx" ON "JobAssignment"("jobId");

-- CreateIndex
CREATE INDEX "JobAssignment_status_idx" ON "JobAssignment"("status");

-- CreateIndex
CREATE INDEX "Attendance_workerId_date_idx" ON "Attendance"("workerId", "date");

-- CreateIndex
CREATE INDEX "Attendance_assignmentId_date_idx" ON "Attendance"("assignmentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_assignmentId_workerId_date_key" ON "Attendance"("assignmentId", "workerId", "date");

-- CreateIndex
CREATE INDEX "AttendanceBreak_attendanceId_idx" ON "AttendanceBreak"("attendanceId");

-- CreateIndex
CREATE INDEX "WorkerRating_workerId_idx" ON "WorkerRating"("workerId");

-- CreateIndex
CREATE INDEX "WorkerRating_employerId_idx" ON "WorkerRating"("employerId");

-- CreateIndex
CREATE INDEX "WorkerReview_workerId_idx" ON "WorkerReview"("workerId");

-- CreateIndex
CREATE INDEX "WorkerReview_employerId_idx" ON "WorkerReview"("employerId");

-- CreateIndex
CREATE INDEX "PaymentAccount_workerId_idx" ON "PaymentAccount"("workerId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_workerId_idx" ON "PaymentTransaction"("workerId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_type_idx" ON "PaymentTransaction"("type");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Complaint_workerId_idx" ON "Complaint"("workerId");

-- CreateIndex
CREATE INDEX "Complaint_employerId_idx" ON "Complaint"("employerId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpRequest" ADD CONSTRAINT "OtpRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAddress" ADD CONSTRAINT "WorkerAddress_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerBankAccount" ADD CONSTRAINT "WorkerBankAccount_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLanguage" ADD CONSTRAINT "WorkerLanguage_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLanguage" ADD CONSTRAINT "WorkerLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerEducation" ADD CONSTRAINT "WorkerEducation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerCertification" ADD CONSTRAINT "WorkerCertification_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentHistory" ADD CONSTRAINT "EmploymentHistory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentReference" ADD CONSTRAINT "EmploymentReference_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "EmploymentHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentDocument" ADD CONSTRAINT "EmploymentDocument_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "EmploymentHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentDocument" ADD CONSTRAINT "EmploymentDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCheck" ADD CONSTRAINT "VerificationCheck_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_verificationCheckId_fkey" FOREIGN KEY ("verificationCheckId") REFERENCES "VerificationCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationConsent" ADD CONSTRAINT "VerificationConsent_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "JobAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceBreak" ADD CONSTRAINT "AttendanceBreak_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerRating" ADD CONSTRAINT "WorkerRating_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerRating" ADD CONSTRAINT "WorkerRating_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerReview" ADD CONSTRAINT "WorkerReview_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerReview" ADD CONSTRAINT "WorkerReview_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAccount" ADD CONSTRAINT "PaymentAccount_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

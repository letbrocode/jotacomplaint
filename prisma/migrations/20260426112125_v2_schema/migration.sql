-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('GARBAGE_BIN', 'DUMP_SITE', 'COLLECTION_POINT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('ROADS', 'WATER', 'ELECTRICITY', 'SANITATION', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('NEW_COMPLAINT', 'STATUS_CHANGED', 'ASSIGNED', 'REASSIGNED', 'COMMENT_ADDED', 'PRIORITY_CHANGED', 'DEPARTMENT_CHANGED', 'REJECTED', 'ESCALATED', 'RESOLVED', 'MARKED_DUPLICATE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMPLAINT_CREATED', 'COMPLAINT_ASSIGNED', 'STATUS_UPDATED', 'COMMENT_ADDED', 'RESOLVED', 'REJECTED', 'ESCALATED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailOnCreated" BOOLEAN NOT NULL DEFAULT true,
    "emailOnAssigned" BOOLEAN NOT NULL DEFAULT true,
    "emailOnStatusUpdate" BOOLEAN NOT NULL DEFAULT true,
    "emailOnResolved" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL DEFAULT 'SANITATION',
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "dueDate" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "parentId" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "departmentId" INTEGER,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "complaintId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintActivity" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ComplaintActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "complaintId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLAPolicy" (
    "id" SERIAL NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "priority" "Priority" NOT NULL,
    "resolutionHrs" INTEGER NOT NULL,
    "escalationHrs" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" INTEGER,

    CONSTRAINT "SLAPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DepartmentStaff" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DepartmentStaff_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_userId_idx" ON "Complaint"("userId");

-- CreateIndex
CREATE INDEX "Complaint_departmentId_idx" ON "Complaint"("departmentId");

-- CreateIndex
CREATE INDEX "Complaint_assignedToId_idx" ON "Complaint"("assignedToId");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_deletedAt_idx" ON "Complaint"("deletedAt");

-- CreateIndex
CREATE INDEX "Complaint_isDuplicate_idx" ON "Complaint"("isDuplicate");

-- CreateIndex
CREATE INDEX "Complaint_dueDate_idx" ON "Complaint"("dueDate");

-- CreateIndex
CREATE INDEX "Comment_complaintId_idx" ON "Comment"("complaintId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "ComplaintActivity_complaintId_idx" ON "ComplaintActivity"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintActivity_createdAt_idx" ON "ComplaintActivity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "SLAPolicy_category_priority_idx" ON "SLAPolicy"("category", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "SLAPolicy_category_priority_departmentId_key" ON "SLAPolicy"("category", "priority", "departmentId");

-- CreateIndex
CREATE INDEX "PublicLocation_type_idx" ON "PublicLocation"("type");

-- CreateIndex
CREATE INDEX "PublicLocation_isActive_idx" ON "PublicLocation"("isActive");

-- CreateIndex
CREATE INDEX "_DepartmentStaff_B_index" ON "_DepartmentStaff"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Complaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintActivity" ADD CONSTRAINT "ComplaintActivity_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintActivity" ADD CONSTRAINT "ComplaintActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SLAPolicy" ADD CONSTRAINT "SLAPolicy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentStaff" ADD CONSTRAINT "_DepartmentStaff_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentStaff" ADD CONSTRAINT "_DepartmentStaff_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

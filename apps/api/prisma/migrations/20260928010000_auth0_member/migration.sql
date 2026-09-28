-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "session";

-- DropTable
DROP TABLE "account";

-- DropTable
DROP TABLE "verification";

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "auth0Subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_auth0Subject_key" ON "Member"("auth0Subject");

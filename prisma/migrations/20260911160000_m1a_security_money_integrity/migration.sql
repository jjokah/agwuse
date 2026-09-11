-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX IF EXISTS "financial_transactions_paystackRef_idx";

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_paystackRef_key" ON "financial_transactions"("paystackRef");

-- CreateTable
CREATE TABLE "receipt_counters" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_counters_pkey" PRIMARY KEY ("year")
);

-- Backfill receipt_counters from existing receipts
INSERT INTO "receipt_counters" ("year", "lastValue", "updatedAt")
SELECT 
    CAST(SUBSTRING("receiptNumber" FROM 4 FOR 4) AS INTEGER) AS "year",
    MAX(CAST(SUBSTRING("receiptNumber" FROM 9) AS INTEGER)) AS "lastValue",
    NOW() AS "updatedAt"
FROM "financial_transactions"
WHERE "receiptNumber" ~ '^AG-[0-9]{4}-[0-9]+$'
GROUP BY CAST(SUBSTRING("receiptNumber" FROM 4 FOR 4) AS INTEGER)
ON CONFLICT ("year") DO UPDATE
SET "lastValue" = EXCLUDED."lastValue", "updatedAt" = NOW();

-- CreateTable
CREATE TABLE "payment_intents" (
    "reference" TEXT NOT NULL,
    "memberId" TEXT,
    "email" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "type" "TransactionType" NOT NULL,
    "category" "OfferingCategory",
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("reference")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_transactionId_key" ON "payment_intents"("transactionId");

-- CreateIndex
CREATE INDEX "payment_intents_status_createdAt_idx" ON "payment_intents"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payment_intents_memberId_idx" ON "payment_intents"("memberId");

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

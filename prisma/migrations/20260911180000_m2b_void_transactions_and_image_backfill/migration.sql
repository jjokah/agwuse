-- Migration M2b: Void fields on FinancialTransaction and image backfill

-- 1. Add void columns to financial_transactions
ALTER TABLE "financial_transactions" ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMP(3);
ALTER TABLE "financial_transactions" ADD COLUMN IF NOT EXISTS "voidedById" TEXT;
ALTER TABLE "financial_transactions" ADD COLUMN IF NOT EXISTS "voidReason" TEXT;

-- 2. Foreign key for voidedBy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_voidedById_fkey') THEN
    ALTER TABLE "financial_transactions"
    ADD CONSTRAINT "financial_transactions_voidedById_fkey"
    FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Index on voidedAt
CREATE INDEX IF NOT EXISTS "financial_transactions_voidedAt_idx" ON "financial_transactions"("voidedAt");

-- 4. Backfill image from profilePhoto if not already populated
UPDATE "users" SET "image" = COALESCE("image", "profilePhoto");

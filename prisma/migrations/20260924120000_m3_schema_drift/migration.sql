-- M3: bring the database in line with schema.prisma (drift found via `prisma migrate diff`).

-- Indexes declared in schema.prisma that no earlier migration created
CREATE INDEX IF NOT EXISTS "events_isPublished_startDate_idx" ON "events"("isPublished", "startDate");
CREATE INDEX IF NOT EXISTS "users_firstName_lastName_idx" ON "users"("firstName", "lastName");

-- New: member giving history / dashboard (filter by memberId, order by date)
CREATE INDEX IF NOT EXISTS "financial_transactions_memberId_date_idx" ON "financial_transactions"("memberId", "date");

-- @updatedAt columns are maintained by Prisma; drop the defaults added by hand in M1a
-- (the raw receipt-counter upsert sets "updatedAt" explicitly).
ALTER TABLE "payment_intents" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "receipt_counters" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- M1b renamed tokens.token -> tokens."tokenHash" but kept the old unique index name
ALTER INDEX IF EXISTS "tokens_token_key" RENAME TO "tokens_tokenHash_key";

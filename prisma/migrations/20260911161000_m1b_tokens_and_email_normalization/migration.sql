-- Rename token column to tokenHash
ALTER TABLE "tokens" RENAME COLUMN "token" TO "tokenHash";

-- Hash any existing tokens in place so existing links continue working
UPDATE "tokens"
SET "tokenHash" = encode(sha256("tokenHash"::bytea), 'hex')
WHERE length("tokenHash") != 64;

-- Drop old unique constraint on email and token
DROP INDEX IF EXISTS "tokens_email_token_key";

-- Create index on email and type
CREATE INDEX "tokens_email_type_idx" ON "tokens"("email", "type");

-- Normalize user emails to lowercase and trim
UPDATE "users" SET "email" = LOWER(TRIM("email"));

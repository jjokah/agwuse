-- Migration M2a: Query Performance Indexes
-- Drop duplicate non-unique indexes on fields that already have unique constraints
DROP INDEX IF EXISTS "users_email_idx";
DROP INDEX IF EXISTS "blog_posts_slug_idx";

-- Add performance indexes for pagination and filtering
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");
CREATE INDEX IF NOT EXISTS "departments_isActive_idx" ON "departments"("isActive");
CREATE INDEX IF NOT EXISTS "departments_category_name_idx" ON "departments"("category", "name");
CREATE INDEX IF NOT EXISTS "financial_transactions_createdAt_idx" ON "financial_transactions"("createdAt");
CREATE INDEX IF NOT EXISTS "pledges_createdAt_idx" ON "pledges"("createdAt");
CREATE INDEX IF NOT EXISTS "blog_posts_published_type_publishedAt_idx" ON "blog_posts"("published", "type", "publishedAt");
CREATE INDEX IF NOT EXISTS "submissions_status_createdAt_idx" ON "submissions"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "gallery_images_albumName_sortOrder_idx" ON "gallery_images"("albumName", "sortOrder");

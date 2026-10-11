-- Additive: existing and future accounts keep contacts private until they opt in.
ALTER TABLE "users" ADD COLUMN "directoryShowEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "directoryShowPhone" BOOLEAN NOT NULL DEFAULT false;

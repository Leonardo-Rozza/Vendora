-- Enforce non-negative inventory quantities at the database level. These CHECK
-- constraints are a safety net independent of the application-level guards
-- (the atomic `updateMany ... WHERE availableQuantity >= n` reservations and the
-- transactional admin adjustment), so stock can never go negative by any path.
--
-- Prisma's schema language cannot express CHECK constraints, so this migration
-- is authored by hand. The constraints are preserved across future Prisma
-- migrations because no schema attribute maps to them.

ALTER TABLE "InventoryItem"
  ADD CONSTRAINT "InventoryItem_availableQuantity_non_negative"
  CHECK ("availableQuantity" >= 0);

ALTER TABLE "InventoryItem"
  ADD CONSTRAINT "InventoryItem_reservedQuantity_non_negative"
  CHECK ("reservedQuantity" >= 0);

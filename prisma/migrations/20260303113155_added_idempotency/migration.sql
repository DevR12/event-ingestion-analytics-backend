/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Event` ADD COLUMN `idempotency_key` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Event_idempotency_key_key` ON `Event`(`idempotency_key`);

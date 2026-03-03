-- DropIndex
DROP INDEX `Event_event_type_occurred_at_idx` ON `Event`;

-- DropIndex
DROP INDEX `Event_user_id_idx` ON `Event`;

-- CreateIndex
CREATE INDEX `Event_occurred_at_event_type_idx` ON `Event`(`occurred_at`, `event_type`);

-- CreateIndex
CREATE INDEX `Event_user_id_occurred_at_idx` ON `Event`(`user_id`, `occurred_at`);

-- CreateIndex
CREATE INDEX `Event_event_type_occurred_at_idx` ON `Event`(`event_type`, `occurred_at`);

-- CreateIndex
CREATE INDEX `Event_user_id_idx` ON `Event`(`user_id`);

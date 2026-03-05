-- CreateTable
CREATE TABLE `DailyEventCount` (
    `date` DATETIME(3) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL,

    PRIMARY KEY (`date`, `event_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

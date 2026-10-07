-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorUserId` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(50) NULL,
    `entityId` VARCHAR(100) NULL,
    `eventId` INTEGER NULL,
    `metadataJson` JSON NULL,
    `ipAddress` VARCHAR(100) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actorUserId_idx`(`actorUserId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entityType_idx`(`entityType`),
    INDEX `audit_logs_eventId_idx`(`eventId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

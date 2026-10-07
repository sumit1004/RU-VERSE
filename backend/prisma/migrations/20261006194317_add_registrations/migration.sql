-- AlterTable
ALTER TABLE `events` ADD COLUMN `registrationLink` VARCHAR(500) NULL,
    ADD COLUMN `registrationMode` ENUM('INTERNAL', 'EXTERNAL') NOT NULL DEFAULT 'INTERNAL';

-- CreateTable
CREATE TABLE `registrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationNumber` VARCHAR(50) NOT NULL,
    `eventId` INTEGER NOT NULL,
    `formId` INTEGER NOT NULL,
    `formVersion` INTEGER NOT NULL DEFAULT 1,
    `registrationType` ENUM('INDIVIDUAL', 'TEAM', 'BOTH') NOT NULL DEFAULT 'INDIVIDUAL',
    `teamName` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'WAITLISTED') NOT NULL DEFAULT 'CONFIRMED',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `registrations_registrationNumber_key`(`registrationNumber`),
    INDEX `registrations_eventId_idx`(`eventId`),
    INDEX `registrations_registrationNumber_idx`(`registrationNumber`),
    INDEX `registrations_status_idx`(`status`),
    INDEX `registrations_submittedAt_idx`(`submittedAt`),
    INDEX `registrations_registrationType_idx`(`registrationType`),
    INDEX `registrations_eventId_status_idx`(`eventId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationId` INTEGER NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(50) NOT NULL,
    `college` VARCHAR(191) NOT NULL,
    `participantOrder` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `participants_registrationId_idx`(`registrationId`),
    INDEX `participants_email_idx`(`email`),
    INDEX `participants_fullName_idx`(`fullName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration_field_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationId` INTEGER NOT NULL,
    `fieldId` INTEGER NULL,
    `fieldKey` VARCHAR(100) NOT NULL,
    `fieldLabel` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `registration_field_values_registrationId_idx`(`registrationId`),
    INDEX `registration_field_values_fieldKey_idx`(`fieldKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participant_field_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participantId` INTEGER NOT NULL,
    `fieldId` INTEGER NULL,
    `fieldKey` VARCHAR(100) NOT NULL,
    `fieldLabel` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `participant_field_values_participantId_idx`(`participantId`),
    INDEX `participant_field_values_fieldKey_idx`(`fieldKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `registration_forms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participants` ADD CONSTRAINT `participants_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_field_values` ADD CONSTRAINT `registration_field_values_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_field_values` ADD CONSTRAINT `registration_field_values_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `registration_form_fields`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant_field_values` ADD CONSTRAINT `participant_field_values_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `participants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant_field_values` ADD CONSTRAINT `participant_field_values_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `registration_form_fields`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

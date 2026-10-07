-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDescription` VARCHAR(255) NULL,
    `description` TEXT NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `venue` VARCHAR(191) NOT NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `endDateTime` DATETIME(3) NOT NULL,
    `registrationStart` DATETIME(3) NOT NULL,
    `registrationEnd` DATETIME(3) NOT NULL,
    `registrationType` ENUM('INDIVIDUAL', 'TEAM', 'BOTH') NOT NULL DEFAULT 'INDIVIDUAL',
    `teamMinSize` INTEGER NULL,
    `teamMaxSize` INTEGER NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isOpenForAll` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `registrationLimit` INTEGER NULL,
    `createdById` INTEGER NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `archivedAt` DATETIME(3) NULL,

    UNIQUE INDEX `events_slug_key`(`slug`),
    INDEX `events_categoryId_idx`(`categoryId`),
    INDEX `events_slug_idx`(`slug`),
    INDEX `events_isPublished_isActive_archivedAt_idx`(`isPublished`, `isActive`, `archivedAt`),
    INDEX `events_isFeatured_idx`(`isFeatured`),
    INDEX `events_startDateTime_idx`(`startDateTime`),
    INDEX `events_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration_forms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdById` INTEGER NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NULL,

    UNIQUE INDEX `registration_forms_eventId_key`(`eventId`),
    INDEX `registration_forms_eventId_idx`(`eventId`),
    INDEX `registration_forms_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration_form_fields` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `fieldKey` VARCHAR(100) NOT NULL,
    `fieldType` ENUM('TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'DATE', 'SELECT', 'RADIO', 'CHECKBOX') NOT NULL DEFAULT 'TEXT',
    `description` VARCHAR(255) NULL,
    `placeholder` VARCHAR(191) NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `fieldScope` ENUM('REGISTRATION', 'PARTICIPANT') NOT NULL DEFAULT 'PARTICIPANT',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `optionsJson` JSON NULL,
    `validationJson` JSON NULL,
    `isFixed` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `registration_form_fields_formId_idx`(`formId`),
    INDEX `registration_form_fields_displayOrder_idx`(`displayOrder`),
    UNIQUE INDEX `registration_form_fields_formId_fieldKey_key`(`formId`, `fieldKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_forms` ADD CONSTRAINT `registration_forms_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_forms` ADD CONSTRAINT `registration_forms_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_forms` ADD CONSTRAINT `registration_forms_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_form_fields` ADD CONSTRAINT `registration_form_fields_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `registration_forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
